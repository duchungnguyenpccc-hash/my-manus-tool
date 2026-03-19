import { and, desc, eq, or } from "drizzle-orm";
import { nicheTopicQueue, topicCandidates } from "../../drizzle/schema";
import { getDb } from "../db";
import { budgetEngine } from "./budgetEngine";
import { strategyEngine, type StrategyTopicScore } from "./strategyEngine";
import { getYouTubeTrendingVideos } from "./trendResearchService";

export type DecisionTopicScore = StrategyTopicScore & {
  budgetDecision: ReturnType<typeof budgetEngine.allocate>;
  sourceEvidence: {
    competingVideos: number;
    medianViews: number;
  };
  status: "approved" | "discarded" | "blocked";
};

async function getHistoricalPatterns(userId: number, nicheId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const [rejected, queued] = await Promise.all([
    db
      .select()
      .from(topicCandidates)
      .where(and(eq(topicCandidates.userId, userId), eq(topicCandidates.nicheId, nicheId), eq(topicCandidates.status, "rejected"))),
    db
      .select()
      .from(nicheTopicQueue)
      .where(and(eq(nicheTopicQueue.userId, userId), eq(nicheTopicQueue.nicheId, nicheId))),
  ]);

  return [...rejected.map((row) => row.topic), ...queued.map((row) => row.topic)];
}

export const decisionEngine = {
  async evaluateTopic(input: {
    userId: number;
    nicheId: number;
    topic: string;
    title?: string;
    monthlyBudget?: number;
    dailyVideoQuota?: number;
  }): Promise<DecisionTopicScore> {
    const historical = await getHistoricalPatterns(input.userId, input.nicheId);
    const strategy = await strategyEngine.scoreTopic({
      topic: input.topic,
      title: input.title,
      historicalTopics: historical,
    });
    const trending = await getYouTubeTrendingVideos("all", 20);
    const related = trending.filter((video) =>
      input.topic
        .toLowerCase()
        .split(/\s+/)
        .some((term) => term.length > 3 && video.title.toLowerCase().includes(term))
    );
    const medianViews =
      related.length > 0
        ? related.map((video) => video.views).sort((a, b) => a - b)[Math.floor(related.length / 2)]
        : 0;

    const status =
      historical.some((topic) => topic.toLowerCase() === input.topic.toLowerCase()) || strategy.noveltyScore < 25
        ? "blocked"
        : strategy.viralProbability >= 75
          ? "approved"
          : "discarded";

    return {
      ...strategy,
      budgetDecision: budgetEngine.allocate({
        viralScore: strategy.viralProbability,
        monthlyBudget: input.monthlyBudget,
        dailyVideoQuota: input.dailyVideoQuota,
      }),
      sourceEvidence: {
        competingVideos: related.length,
        medianViews,
      },
      status,
    };
  },

  async rankAndGateTopics(input: {
    userId: number;
    nicheId: number;
    topics: Array<{ topic: string; title?: string }>;
    monthlyBudget?: number;
    dailyVideoQuota?: number;
  }) {
    const evaluations = await Promise.all(
      input.topics.map((topic) =>
        this.evaluateTopic({
          userId: input.userId,
          nicheId: input.nicheId,
          topic: topic.topic,
          title: topic.title,
          monthlyBudget: input.monthlyBudget,
          dailyVideoQuota: input.dailyVideoQuota,
        })
      )
    );

    const ranked = evaluations.sort((a, b) => b.viralProbability - a.viralProbability);
    const approved = ranked.filter((item) => item.status === "approved");
    const keepCount = Math.max(1, Math.ceil(ranked.length * 0.05));
    const selected = approved.slice(0, keepCount);

    return {
      generated: ranked.length,
      selectedCount: selected.length,
      discardCount: ranked.length - selected.length,
      ranked,
      selected,
    };
  },

  async recordFailurePattern(input: { userId: number; nicheId: number; topic: string; reason: string }) {
    const db = await getDb();
    if (!db) return { success: false };

    await db.insert(topicCandidates).values({
      userId: input.userId,
      nicheId: input.nicheId,
      topic: input.topic,
      titleSuggestion: input.topic.slice(0, 255),
      hookSuggestion: input.reason,
      score: 0,
      source: "decision_engine",
      status: "rejected",
      metadata: { reason: input.reason, blocked: true },
    });

    return { success: true };
  },
};
