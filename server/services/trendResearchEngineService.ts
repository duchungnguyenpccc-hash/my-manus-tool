import { getDb } from "../db";
import { and, desc, eq } from "drizzle-orm";
import { nicheTopicQueue, niches, videoProjects } from "../../drizzle/schema";
import {
  getTrendingTopics,
  getYouTubeTrendingVideos,
  analyzeContentPerformance,
} from "./trendResearchService";
import axios from "axios";

export type TrendSeed = {
  keyword: string;
  score: number;
  source: "google_trends" | "youtube_trending" | "historical_performance";
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
        source: "historical_performance" as const,
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
    const [trendTopics, youtubeTrends, recentProjects, redditTrends, twitterTrends] = await Promise.all([
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
    return seeds.slice(0, limit).map((seed, index) => ({
      topic: seed.keyword,
      priority: Math.max(1, 100 - index * 5),
      source: seed.source,
      score: seed.score,
    }));
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
