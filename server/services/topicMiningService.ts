import { decisionEngine } from "./decisionEngine";
import { trendResearchEngineService } from "./trendResearchEngineService";

export const topicMiningService = {
  async discoverTopicsForNiche(input: { nicheId: number; userId: number; limit?: number }) {
    const limit = input.limit ?? 10;
    const seeds = await trendResearchEngineService.fetchTrendSeeds(input.nicheId, input.userId);
    const strategy = await decisionEngine.rankAndGateTopics({
      userId: input.userId,
      nicheId: input.nicheId,
      topics: seeds.slice(0, Math.max(limit, 50)).map((seed) => ({ topic: seed.keyword, title: seed.keyword })),
    });

    return {
      seedsFound: seeds.length,
      threshold: strategy.profile.performanceBaseline.averageObjectiveScore,
      rankedTopics: strategy.ranked,
      selectedTopics: strategy.selected,
      profile: strategy.profile,
    };
  },

  async mineAndQueueTopics(input: { nicheId: number; userId: number; limit?: number; boostPriority?: number; source?: string }) {
    const discovered = await this.discoverTopicsForNiche(input);
    const result = await trendResearchEngineService.pushIdeasToNicheQueue(
      input.nicheId,
      input.userId,
      discovered.selectedTopics.map((topic) => ({
        topic: topic.topic,
        priority: Math.max(1, 101 - topic.viralProbability - (input.boostPriority ?? 0)),
        source: input.source ?? "topic_mining",
      }))
    );

    return {
      ...result,
      selectedTopics: discovered.selectedTopics,
      profile: discovered.profile,
    };
  },
};
