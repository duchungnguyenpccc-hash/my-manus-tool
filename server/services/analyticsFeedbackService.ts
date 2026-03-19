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
};
