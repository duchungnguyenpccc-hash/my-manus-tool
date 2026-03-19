import { analyticsFeedbackService } from "./analyticsFeedbackService";
import { decisionEngine } from "./decisionEngine";
import { objectiveEngine } from "./objectiveEngine";
import { topicMiningService } from "./topicMiningService";
import { topicRapidGenerator } from "./topicRapidGenerator";
import { getAudienceRetention } from "./youtubeAnalyticsService";

export const analyticsService = {
  async fetchStoreAndLearn(input: { projectId: number; userId: number; nicheId?: number; youtubeVideoId?: string }) {
    const metrics = await analyticsFeedbackService.captureVideoMetrics(input.projectId, input.userId);
    const retention = input.youtubeVideoId
      ? await getAudienceRetention(input.youtubeVideoId)
      : { averageRetention: 0, retentionCurve: [], dropoffPoints: [] };

    const learningSnapshot = input.nicheId
      ? await analyticsFeedbackService.getTopicLearningSnapshot(input.nicheId, input.userId)
      : null;

    const learningResult = input.nicheId
      ? await objectiveEngine.recordOutcome({
          userId: input.userId,
          nicheId: input.nicheId,
          topic: metrics.title,
          title: metrics.title,
          hook: metrics.title,
          metrics: {
            views: metrics.views,
            watchTimeMinutes: metrics.watchTime,
            revenue: metrics.revenue,
            ctr: metrics.ctr,
            retention: retention.averageRetention,
          },
          factorSignals: {
            ctr: Math.min(1, metrics.ctr / 10),
            retention: Math.min(1, retention.averageRetention / 100),
            demand: Math.min(1, metrics.views / Math.max(1, learningSnapshot?.averageViews ?? 10000)),
          },
        })
      : null;

    const winLoseTag = learningResult?.status === "WIN" ? "WIN" : "LOSE";

    let scalingAction: { triggered: boolean; reason: string; inserted?: number; replicationCount?: number; videosPerDay?: number } | null = null;
    if (winLoseTag === "WIN" && input.nicheId && learningResult) {
      const replicationCount = Math.max(20, Math.min(50, learningResult.profile.productionPolicy.replicationCount));
      const rapid = await topicRapidGenerator.generateRapidTopics({
        nicheId: input.nicheId,
        userId: input.userId,
        count: replicationCount,
      });
      const similar = await topicMiningService.mineAndQueueTopics({
        nicheId: input.nicheId,
        userId: input.userId,
        limit: Math.max(20, Math.min(50, rapid.selectedTopics.length)),
        boostPriority: 20,
        source: "win_replication",
      });
      scalingAction = {
        triggered: true,
        reason: "Winning pattern replicated aggressively and production rate increased.",
        inserted: similar.inserted,
        replicationCount,
        videosPerDay: learningResult.profile.productionPolicy.videosPerDay,
      };
    } else if (winLoseTag === "LOSE" && input.nicheId) {
      await decisionEngine.recordFailurePattern({
        userId: input.userId,
        nicheId: input.nicheId,
        topic: metrics.title,
        reason: "Objective function underperformed rolling baseline",
      });
      scalingAction = {
        triggered: false,
        reason: "Dynamic kill system marked this pattern as a candidate for blacklist.",
      };
    }

    return {
      metrics,
      retention: retention.averageRetention,
      tag: winLoseTag,
      learningSnapshot,
      learningResult,
      scalingAction,
    };
  },
};
