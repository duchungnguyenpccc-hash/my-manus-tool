import { and, desc, eq } from "drizzle-orm";
import { analyticsFeedback, videoProjects } from "../../drizzle/schema";
import { getDb } from "../db";
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
    const rows = await this.getNicheFeedback(nicheId, userId);
    if (!rows.length) {
      return {
        nicheId,
        samples: 0,
        averageCtr: 0,
        averageEngagementRate: 0,
        averageViews: 0,
        recommendedViralThreshold: Number(process.env.VIRAL_SCORE_THRESHOLD ?? 65),
        insights: ["Not enough post-publish analytics yet. Keep collecting data before tightening the gate."],
      };
    }

    const totals = rows.reduce(
      (acc, row) => {
        acc.ctr += row.ctr;
        acc.engagementRate += row.engagementRate;
        acc.views += row.views;
        return acc;
      },
      { ctr: 0, engagementRate: 0, views: 0 }
    );

    const averageCtr = Math.round(totals.ctr / rows.length);
    const averageEngagementRate = Math.round(totals.engagementRate / rows.length);
    const averageViews = Math.round(totals.views / rows.length);
    const recommendedViralThreshold = Math.max(
      55,
      Math.min(85, Math.round(averageCtr * 0.35 + averageEngagementRate * 0.25 + (averageViews > 10000 ? 20 : 10)))
    );

    const insights = [
      averageCtr >= 6 ? "CTR is healthy; prioritize aggressive title and thumbnail testing." : "CTR is soft; improve packaging before scaling production.",
      averageEngagementRate >= 8
        ? "Engagement is strong; similar topics deserve more publishing budget."
        : "Engagement lags; refine hook selection and pacing before expanding.",
      averageViews >= 10000
        ? "This niche is proving monetizable traction; consider increasing posting frequency."
        : "Views are still inconsistent; keep the viral gate strict and focus on higher-demand topics.",
    ];

    return {
      nicheId,
      samples: rows.length,
      averageCtr,
      averageEngagementRate,
      averageViews,
      recommendedViralThreshold,
      insights,
    };
  },
};
