import { and, desc, eq } from "drizzle-orm";
import { analyticsFeedback, videoProjects } from "../../drizzle/schema";
import { getDb } from "../db";
import { objectiveEngine } from "./objectiveEngine";
import { getVideoMetrics } from "./youtubeAnalyticsService";

export const analyticsFeedbackService = {
  async captureVideoMetrics(projectId: number, userId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const project = await db
      .select()
      .from(videoProjects)
      .where(and(eq(videoProjects.id, projectId), eq(videoProjects.userId, userId)))
      .limit(1);

    if (!project.length || !project[0].youtubeVideoId) {
      throw new Error("Project chưa có youtubeVideoId");
    }

    const metrics = await getVideoMetrics(project[0].youtubeVideoId);

    await db.insert(analyticsFeedback).values({
      userId,
      projectId,
      nicheId: Number(((project[0].config ?? {}) as Record<string, unknown>).nicheId ?? 0) || null,
      youtubeVideoId: project[0].youtubeVideoId,
      views: metrics.views,
      watchTimeMinutes: metrics.watchTime,
      ctr: Math.round(metrics.ctr * 100),
      engagementRate: Math.round(metrics.engagementRate * 100),
      likes: metrics.likes,
      comments: metrics.comments,
      shares: metrics.shares,
      rawMetrics: metrics as unknown as Record<string, unknown>,
    });

    return metrics;
  },

  async getNicheFeedback(nicheId: number, userId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db
      .select()
      .from(analyticsFeedback)
      .where(and(eq(analyticsFeedback.nicheId, nicheId), eq(analyticsFeedback.userId, userId)))
      .orderBy(desc(analyticsFeedback.capturedAt))
      .limit(50);
  },

  async getTopicLearningSnapshot(nicheId: number, userId: number) {
    const [rows, profile] = await Promise.all([this.getNicheFeedback(nicheId, userId), objectiveEngine.getProfile(userId, nicheId)]);

    if (!rows.length) {
      return {
        nicheId,
        samples: 0,
        averageCtr: 0,
        averageEngagementRate: 0,
        averageViews: 0,
        objectiveScore: profile.performanceBaseline.averageObjectiveScore,
        factorWeights: profile.factorWeights,
        productionPolicy: profile.productionPolicy,
        budgetPolicy: profile.budgetPolicy,
        blacklistedPatterns: profile.blacklistedPatterns,
        insights: ["Not enough post-publish analytics yet. Autonomous mode is collecting signals before tightening the loop."],
      };
    }

    const totals = rows.reduce(
      (acc, row) => {
        acc.ctr += row.ctr;
        acc.engagementRate += row.engagementRate;
        acc.views += row.views;
        acc.watchTime += row.watchTimeMinutes;
        acc.revenue += Number(((row.rawMetrics ?? {}) as Record<string, unknown>).revenue ?? 0);
        return acc;
      },
      { ctr: 0, engagementRate: 0, views: 0, watchTime: 0, revenue: 0 }
    );

    const averageCtr = Math.round(totals.ctr / rows.length);
    const averageEngagementRate = Math.round(totals.engagementRate / rows.length);
    const averageViews = Math.round(totals.views / rows.length);
    const averageWatchTimeMinutes = Math.round(totals.watchTime / rows.length);
    const averageRevenue = Number((totals.revenue / rows.length).toFixed(2));

    const insights = [
      `Decision weights are evolving toward CTR ${Math.round(profile.factorWeights.ctr * 100)}% / retention ${Math.round(profile.factorWeights.retention * 100)}% / demand ${Math.round(profile.factorWeights.demand * 100)}%.`,
      profile.budgetPolicy.lastKnownRoi >= 1.2
        ? "ROI is compounding; autonomous mode can safely spend more on the best patterns."
        : "ROI is under pressure; the engine is reducing spend and expanding exploration.",
      profile.blacklistedPatterns.length > 0
        ? `Kill system is blocking ${profile.blacklistedPatterns.length} low-performing patterns from reuse.`
        : "No durable failure patterns have been blacklisted yet.",
    ];

    return {
      nicheId,
      samples: rows.length,
      averageCtr,
      averageEngagementRate,
      averageViews,
      averageWatchTimeMinutes,
      averageRevenue,
      objectiveScore: profile.performanceBaseline.averageObjectiveScore,
      factorWeights: profile.factorWeights,
      productionPolicy: profile.productionPolicy,
      budgetPolicy: profile.budgetPolicy,
      blacklistedPatterns: profile.blacklistedPatterns,
      insights,
    };
  },
};
