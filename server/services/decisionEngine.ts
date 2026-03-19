import { and, eq } from "drizzle-orm";
import { nicheTopicQueue, topicCandidates } from "../../drizzle/schema";
import { getDb } from "../db";
import { budgetEngine } from "./budgetEngine";
import { objectiveEngine } from "./objectiveEngine";
import { strategyEngine, type StrategyTopicScore } from "./strategyEngine";
import { getYouTubeTrendingVideos } from "./trendResearchService";

export type DecisionTopicScore = StrategyTopicScore & {
  adaptiveScore: number;
  budgetDecision: Awaited<ReturnType<typeof budgetEngine.allocate>>;
  sourceEvidence: {
    competingVideos: number;
    medianViews: number;
  };
  factorWeights: {
    ctr: number;
    retention: number;
    demand: number;
  };
  decisionContext: {
    factorSignals: {
      ctr: number;
      retention: number;
      demand: number;
    };
    blacklistedPatterns: string[];
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

function toTerms(topic: string) {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 3);
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
    const [historical, profile] = await Promise.all([
      getHistoricalPatterns(input.userId, input.nicheId),
      objectiveEngine.getProfile(input.userId, input.nicheId),
    ]);

    const strategy = await strategyEngine.scoreTopic({
      topic: input.topic,
      title: input.title,
      historicalTopics: historical,
    });
    const trending = await getYouTubeTrendingVideos("all", 20);
    const terms = toTerms(input.topic);
    const related = trending.filter((video) => terms.some((term) => video.title.toLowerCase().includes(term)));
    const medianViews =
      related.length > 0
        ? related.map((video) => video.views).sort((a, b) => a - b)[Math.floor(related.length / 2)]
        : 0;

    const blacklistedPatterns = profile.blacklistedPatterns.filter((pattern) => input.topic.toLowerCase().includes(pattern));
    const factorSignals = {
      ctr: Math.min(1, strategy.predictedCTR / 10),
      retention: Math.min(1, strategy.predictedRetention / 100),
      demand: Math.min(1, (strategy.demandScore + Math.min(100, medianViews / 1000)) / 200),
    };
    const adaptiveScore = Number(
      (
        factorSignals.ctr * profile.factorWeights.ctr +
        factorSignals.retention * profile.factorWeights.retention +
        factorSignals.demand * profile.factorWeights.demand
      )
        .toFixed(3)
    );
    const adaptiveThreshold = Math.max(0.48, Math.min(0.82, profile.performanceBaseline.averageObjectiveScore * 0.52));

    const budgetDecision = await budgetEngine.allocate({
      userId: input.userId,
      nicheId: input.nicheId,
      viralScore: strategy.viralProbability,
      estimatedViews: medianViews || profile.performanceBaseline.averageViews,
      estimatedRevenue: profile.budgetPolicy.estimatedRevenuePerVideo * Math.max(0.6, adaptiveScore),
      costPerVideo: profile.budgetPolicy.targetCostPerVideo,
      profile,
    });

    const status =
      historical.some((topic) => topic.toLowerCase() === input.topic.toLowerCase()) || blacklistedPatterns.length > 0 || strategy.noveltyScore < 20
        ? "blocked"
        : adaptiveScore >= adaptiveThreshold
          ? "approved"
          : "discarded";

    return {
      ...strategy,
      adaptiveScore,
      factorWeights: profile.factorWeights,
      budgetDecision,
      sourceEvidence: {
        competingVideos: related.length,
        medianViews,
      },
      decisionContext: {
        factorSignals,
        blacklistedPatterns,
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
    const profile = await objectiveEngine.getProfile(input.userId, input.nicheId);
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

    const ranked = evaluations.sort((a, b) => b.adaptiveScore - a.adaptiveScore || b.viralProbability - a.viralProbability);
    const approved = ranked.filter((item) => item.status === "approved");
    const keepCount = Math.max(1, Math.ceil(ranked.length * Math.max(0.05, 1 - profile.productionPolicy.explorationRate) * 0.1));
    const selected = approved.slice(0, keepCount);

    return {
      generated: ranked.length,
      selectedCount: selected.length,
      discardCount: ranked.length - selected.length,
      ranked,
      selected,
      profile,
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

    const profile = await objectiveEngine.getProfile(input.userId, input.nicheId);
    objectiveEngine.updateBlacklist(profile, input.topic, false);
    profile.losses += 1;
    profile.totalDecisions += 1;
    await objectiveEngine.saveProfile(profile);

    return { success: true, blacklistedPatterns: profile.blacklistedPatterns };
  },
};
