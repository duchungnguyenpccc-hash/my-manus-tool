import {
  type RankedTopicCandidate,
  calculateTopicNoveltyScore,
  rankTopicsByViralPotential,
  simulateViralPotential,
} from "./youtubeAlgorithmSimulatorService";

export type StrategyTopicScore = {
  topic: string;
  title: string;
  curiosityScore: number;
  emotionalScore: number;
  clickPotential: number;
  retentionPotential: number;
  demandScore: number;
  competitionScore: number;
  noveltyScore: number;
  predictedCTR: number;
  predictedRetention: number;
  viralProbability: number;
  decision: "allow" | "reject";
  threshold: number;
  reasons: string[];
};

const CURIOSITY_TERMS = ["how", "why", "secret", "mistake", "before", "truth", "hidden", "avoid", "fast"];
const EMOTIONAL_TERMS = ["shocking", "insane", "fear", "win", "crush", "amazing", "urgent", "warning", "easy"];

function keywordScore(topic: string, keywords: string[]) {
  const normalized = topic.toLowerCase();
  return Math.min(100, keywords.filter((term) => normalized.includes(term)).length * 18 + 25);
}

export const strategyEngine = {
  async scoreTopic(input: {
    topic: string;
    title?: string;
    hook?: string;
    structure?: string;
    threshold?: number;
    historicalTopics?: string[];
  }): Promise<StrategyTopicScore> {
    const result = await simulateViralPotential({
      topic: input.topic,
      title: input.title ?? input.topic,
      hook: input.hook,
      structure: input.structure,
      threshold: input.threshold,
    });

    const noveltyScore = calculateTopicNoveltyScore(input.topic, input.historicalTopics ?? []);

    return {
      topic: input.topic,
      title: input.title ?? input.topic,
      curiosityScore: keywordScore(input.topic, CURIOSITY_TERMS),
      emotionalScore: keywordScore(input.topic, EMOTIONAL_TERMS),
      clickPotential: Math.round(result.ctrScore * 0.7 + keywordScore(input.topic, CURIOSITY_TERMS) * 0.3),
      retentionPotential: Math.round(result.retentionScore * 0.7 + keywordScore(input.topic, EMOTIONAL_TERMS) * 0.3),
      demandScore: result.demandScore,
      competitionScore: result.competitionScore,
      noveltyScore,
      predictedCTR: result.ctrScore,
      predictedRetention: result.retentionScore,
      viralProbability: result.viralProbability,
      decision: result.decision,
      threshold: result.threshold,
      reasons: [...result.reasons, `Novelty score: ${noveltyScore}`],
    };
  },

  async rankTopics(input: {
    topics: Array<{ topic: string; title?: string; hook?: string; structure?: string }>;
    threshold?: number;
    topN?: number;
    historicalTopics?: string[];
  }): Promise<{
    threshold: number;
    topN: number;
      ranked: Array<StrategyTopicScore & { rank: number }>;
      selected: Array<StrategyTopicScore & { rank: number }>;
  }> {
    const rankedBase = await rankTopicsByViralPotential(input);
    const noveltyLookup = new Map(
      rankedBase.ranked.map((candidate) => [
        candidate.topic,
        calculateTopicNoveltyScore(
          candidate.topic,
          (input.historicalTopics ?? []).filter((topic) => topic !== candidate.topic)
        ),
      ])
    );

    const ranked: Array<StrategyTopicScore & { rank: number }> = rankedBase.ranked.map((candidate, index) => ({
      topic: candidate.topic,
      title: candidate.title,
      curiosityScore: keywordScore(candidate.topic, CURIOSITY_TERMS),
      emotionalScore: keywordScore(candidate.topic, EMOTIONAL_TERMS),
      clickPotential: Math.round(candidate.scores.ctr * 0.7 + keywordScore(candidate.topic, CURIOSITY_TERMS) * 0.3),
      retentionPotential: Math.round(candidate.scores.retention * 0.7 + keywordScore(candidate.topic, EMOTIONAL_TERMS) * 0.3),
      demandScore: candidate.scores.demand,
      competitionScore: candidate.scores.competition,
      noveltyScore: noveltyLookup.get(candidate.topic) ?? 90,
      predictedCTR: candidate.scores.ctr,
      predictedRetention: candidate.scores.retention,
      viralProbability: candidate.scores.viralProbability,
      decision: candidate.decision,
      threshold: rankedBase.threshold,
      reasons: candidate.reasons,
      rank: index + 1,
    }));

    return {
      threshold: rankedBase.threshold,
      topN: rankedBase.topN,
      ranked,
      selected: ranked.filter((item) => item.decision === "allow").slice(0, Math.max(1, Math.ceil(ranked.length * 0.2), rankedBase.topN)),
    };
  },

  summarizeCandidate(candidate: RankedTopicCandidate) {
    return {
      topic: candidate.topic,
      viralProbability: candidate.scores.viralProbability,
      predictedCTR: candidate.scores.ctr,
      predictedRetention: candidate.scores.retention,
      demandScore: candidate.scores.demand,
      competitionScore: candidate.scores.competition,
    };
  },
};
