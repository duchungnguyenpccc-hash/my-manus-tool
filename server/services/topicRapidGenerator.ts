import { and, eq } from "drizzle-orm";
import { niches } from "../../drizzle/schema";
import { getDb } from "../db";
import { decisionEngine } from "./decisionEngine";
import { objectiveEngine } from "./objectiveEngine";
import { trendResearchEngineService } from "./trendResearchEngineService";

const CURIOSITY_HOOKS = [
  "How to",
  "The hidden truth about",
  "Why nobody talks about",
  "Before you try",
  "The biggest mistake in",
];

const EMOTIONAL_TRIGGERS = [
  "that changed everything",
  "that creators are obsessed with",
  "that could double your results",
  "that most people ignore",
  "that wins fast",
];

export const topicRapidGenerator = {
  async generateRapidTopics(input: { nicheId: number; userId: number; count?: number }) {
    const profile = await objectiveEngine.getProfile(input.userId, input.nicheId);
    const count = Math.max(20, Math.min(100, input.count ?? profile.productionPolicy.replicationCount));
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const niche = await db
      .select()
      .from(niches)
      .where(and(eq(niches.id, input.nicheId), eq(niches.userId, input.userId)))
      .limit(1);

    if (!niche.length) throw new Error("Niche not found");

    const nicheName = niche[0].nicheName;
    const seeds = await trendResearchEngineService.fetchTrendSeeds(input.nicheId, input.userId);
    const keywords = Array.from(new Set(seeds.map((seed) => seed.keyword).slice(0, 30)));
    const generated = new Set<string>();

    for (const keyword of keywords) {
      for (const hook of CURIOSITY_HOOKS) {
        for (const trigger of EMOTIONAL_TRIGGERS) {
          generated.add(`${hook} ${keyword} ${trigger}`.trim());
          if (generated.size >= count) break;
        }
        if (generated.size >= count) break;
      }
      if (generated.size >= count) break;
    }

    const ranked = await decisionEngine.rankAndGateTopics({
      userId: input.userId,
      nicheId: input.nicheId,
      topics: Array.from(generated).map((topic) => ({ topic, title: topic })),
    });

    return {
      nicheName,
      generatedCount: generated.size,
      selectedCount: ranked.selectedCount,
      rankedTopics: ranked.ranked,
      selectedTopics: ranked.selected,
      productionPolicy: ranked.profile.productionPolicy,
    };
  },
};
