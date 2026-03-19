import { trendResearchEngineService } from "./trendResearchEngineService";
import { strategyEngine } from "./strategyEngine";

export const topicMiningService = {
  async discoverTopicsForNiche(input: { nicheId: number; userId: number; limit?: number }) {
    const limit = input.limit ?? 10;
    const seeds = await trendResearchEngineService.fetchTrendSeeds(input.nicheId, input.userId);
    const strategy = await strategyEngine.rankTopics({
      topics: seeds.slice(0, Math.max(limit, 20)).map((seed) => ({ topic: seed.keyword, title: seed.keyword })),
      topN: limit,
      historicalTopics: seeds.map((seed) => seed.keyword),
    });

    return {
      seedsFound: seeds.length,
      threshold: strategy.threshold,
      rankedTopics: strategy.ranked,
      selectedTopics: strategy.selected,
    };
  },

  async mineAndQueueTopics(input: { nicheId: number; userId: number; limit?: number }) {
    const discovered = await this.discoverTopicsForNiche(input);
    const result = await trendResearchEngineService.pushIdeasToNicheQueue(
      input.nicheId,
      input.userId,
      discovered.selectedTopics.map((topic) => ({
        topic: topic.topic,
        priority: Math.max(1, 101 - topic.viralProbability),
        source: "topic_mining",
      }))
    );

    return {
      ...result,
      selectedTopics: discovered.selectedTopics,
    };
  },
};
