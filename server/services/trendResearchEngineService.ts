import { getDb } from "../db";
import { and, desc, eq } from "drizzle-orm";
import { nicheTopicQueue, niches, videoProjects } from "../../drizzle/schema";
import {
  getTrendingTopics,
  getYouTubeTrendingVideos,
  analyzeContentPerformance,
} from "./trendResearchService";
import axios from "axios";
import { calculateTopicNoveltyScore, rankTopicsByViralPotential } from "./youtubeAlgorithmSimulatorService";

export type TrendSeed = {
  keyword: string;
  score: number;
  source: "google_trends" | "youtube_trending" | "historical_performance" | "reddit" | "youtube_suggest" | "google_autocomplete";
};

export type RankedTopicIdea = {
  topic: string;
  source: TrendSeed["source"];
  searchDemand: number;
  competition: number;
  novelty: number;
  viralScore: number;
  monetizationFit: number;
  priority: number;
};

const fallbackIdeas = [
  "Top 5 sai lầm người mới hay mắc",
  "Hướng dẫn từng bước cho người bắt đầu",
  "So sánh phương pháp A vs B",
  "Checklist tối ưu trong 7 ngày",
  "Case study thực tế + bài học rút ra",
];

export const trendResearchEngineService = {
  async fetchRedditTrends(nicheKeyword: string): Promise<TrendSeed[]> {
    try {
      const response = await axios.get(`https://www.reddit.com/search.json`, {
        params: { q: nicheKeyword, sort: "hot", limit: 10, type: "link" },
        timeout: 8000,
        headers: { "User-Agent": "my-manus-tool/1.0" },
      });

      const posts = response.data?.data?.children ?? [];
      return posts.map((p: any) => ({
        keyword: String(p?.data?.title ?? ""),
        score: Number(p?.data?.score ?? 0),
        source: "reddit" as const,
      }));
    } catch {
      return [];
    }
  },

  async fetchTwitterTrends(nicheKeyword: string): Promise<TrendSeed[]> {
    // Không gọi API X trực tiếp trong local/dev nếu chưa cấu hình key.
    // Fallback sang seed nội bộ để pipeline vẫn chạy autonomous.
    return [
      { keyword: `${nicheKeyword} breaking update`, score: 60, source: "historical_performance" },
      { keyword: `${nicheKeyword} tips`, score: 55, source: "historical_performance" },
    ];
  },

  async fetchYoutubeSuggestions(keyword: string): Promise<TrendSeed[]> {
    try {
      const response = await axios.get("https://suggestqueries.google.com/complete/search", {
        params: { client: "firefox", ds: "yt", q: keyword },
        timeout: 8000,
      });

      const suggestions = Array.isArray(response.data?.[1]) ? response.data[1] : [];
      return suggestions.slice(0, 10).map((item: string, index: number) => ({
        keyword: item,
        score: Math.max(30, 100 - index * 8),
        source: "youtube_suggest" as const,
      }));
    } catch {
      return [];
    }
  },

  async fetchGoogleAutocomplete(keyword: string): Promise<TrendSeed[]> {
    try {
      const response = await axios.get("https://suggestqueries.google.com/complete/search", {
        params: { client: "firefox", q: keyword },
        timeout: 8000,
      });

      const suggestions = Array.isArray(response.data?.[1]) ? response.data[1] : [];
      return suggestions.slice(0, 10).map((item: string, index: number) => ({
        keyword: item,
        score: Math.max(25, 95 - index * 7),
        source: "google_autocomplete" as const,
      }));
    } catch {
      return [];
    }
  },

  async fetchTrendSeeds(nicheId: number, userId: number): Promise<TrendSeed[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const niche = await db
      .select()
      .from(niches)
      .where(and(eq(niches.id, nicheId), eq(niches.userId, userId)))
      .limit(1);

    if (!niche.length) {
      throw new Error("Niche not found");
    }

    const category = niche[0].category || niche[0].nicheName;
    const [trendTopics, youtubeTrends, recentProjects, redditTrends, twitterTrends, youtubeSuggestions, googleAutocomplete] = await Promise.all([
      getTrendingTopics(category, "en-US"),
      getYouTubeTrendingVideos(category, 10),
      db
        .select()
        .from(videoProjects)
        .where(eq(videoProjects.userId, userId))
        .orderBy(desc(videoProjects.createdAt))
        .limit(30),
      this.fetchRedditTrends(category),
      this.fetchTwitterTrends(category),
      this.fetchYoutubeSuggestions(category),
      this.fetchGoogleAutocomplete(category),
    ]);

    const seeds: TrendSeed[] = [];

    for (const t of trendTopics) {
      const normalizedScore = Math.max(1, Math.round((t.searchVolume / 1000) * (1 + t.growthRate / 100)));
      seeds.push({ keyword: t.keyword, score: normalizedScore, source: "google_trends" });
    }

    for (const v of youtubeTrends) {
      const perf = analyzeContentPerformance(v.views, v.likes, v.comments, v.uploadedAt);
      const score = Math.round(perf.viewsPerDay + perf.engagementScore * 100);
      seeds.push({ keyword: v.title, score, source: "youtube_trending" });
    }

    for (const p of recentProjects) {
      if (p.status !== "completed") continue;
      const cfg = (p.config ?? {}) as Record<string, unknown>;
      if (Number(cfg.nicheId ?? 0) !== nicheId) continue;
      seeds.push({ keyword: p.topic, score: 120, source: "historical_performance" });
    }

    seeds.push(...redditTrends);
    seeds.push(...twitterTrends);
    seeds.push(...youtubeSuggestions);
    seeds.push(...googleAutocomplete);

    if (!seeds.length) {
      return fallbackIdeas.map((idea, idx) => ({
        keyword: `${category}: ${idea}`,
        score: 100 - idx * 10,
        source: "historical_performance",
      }));
    }

    return seeds.sort((a, b) => b.score - a.score).slice(0, 30);
  },

  async generateTopicIdeasForNiche(nicheId: number, userId: number, limit = 10) {
    const seeds = await this.fetchTrendSeeds(nicheId, userId);
    const ranked = await this.rankTopicIdeas(
      seeds.map((seed) => ({ topic: seed.keyword, source: seed.source, demandSeed: seed.score })),
      limit
    );

    return ranked.map((seed) => ({
      topic: seed.topic,
      priority: seed.priority,
      source: seed.source,
      score: seed.viralScore,
      ranking: {
        searchDemand: seed.searchDemand,
        competition: seed.competition,
        novelty: seed.novelty,
        monetizationFit: seed.monetizationFit,
      },
    }));
  },

  async rankTopicIdeas(
    ideas: Array<{ topic: string; source: TrendSeed["source"]; demandSeed?: number }>,
    limit = 10
  ): Promise<RankedTopicIdea[]> {
    const rankedViral = await rankTopicsByViralPotential({
      topics: ideas.slice(0, 20).map((idea) => ({ topic: idea.topic })),
      topN: Math.min(limit, Number(process.env.VIRAL_GATE_TOP_N ?? limit)),
    });

    const existingTopics = ideas.map((idea) => idea.topic);

    const ranked = ideas.map((idea) => {
      const viral = rankedViral.ranked.find((item) => item.topic === idea.topic);
      const novelty = calculateTopicNoveltyScore(
        idea.topic,
        existingTopics.filter((topic) => topic !== idea.topic)
      );
      const monetizationFit = Math.min(100, Math.round((viral?.scores.ctr ?? 60) * 0.4 + (viral?.scores.demand ?? 60) * 0.6));
      const competition = viral?.scores.competition ?? 50;
      const searchDemand = Math.min(100, Math.round((idea.demandSeed ?? 50) * 0.45 + (viral?.scores.demand ?? 50) * 0.55));
      const viralScore = Math.min(
        100,
        Math.round((viral?.scores.viralProbability ?? 50) * 0.45 + searchDemand * 0.25 + novelty * 0.2 + monetizationFit * 0.1)
      );

      return {
        topic: idea.topic,
        source: idea.source,
        searchDemand,
        competition,
        novelty,
        monetizationFit,
        viralScore,
        priority: Math.max(1, 101 - viralScore),
      } satisfies RankedTopicIdea;
    });

    return ranked
      .sort((a, b) => b.viralScore - a.viralScore || b.novelty - a.novelty)
      .slice(0, limit);
  },

  async pushIdeasToNicheQueue(
    nicheId: number,
    userId: number,
    topics: Array<{ topic: string; priority?: number; source?: string }>
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (topics.length === 0) return { inserted: 0 };

    await db.insert(nicheTopicQueue).values(
      topics.map((t) => ({
        nicheId,
        userId,
        topic: t.topic,
        priority: t.priority ?? 100,
        source: t.source ?? "trend_engine",
        status: "queued" as const,
      }))
    );

    return { inserted: topics.length };
  },
};
