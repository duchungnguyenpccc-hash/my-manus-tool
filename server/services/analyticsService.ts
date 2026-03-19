import { analyticsFeedbackService } from "./analyticsFeedbackService";
import { getAudienceRetention } from "./youtubeAnalyticsService";
import { topicMiningService } from "./topicMiningService";
import { topicRapidGenerator } from "./topicRapidGenerator";
import { decisionEngine } from "./decisionEngine";

export const analyticsService = {
  async fetchStoreAndLearn(input: { projectId: number; userId: number; nicheId?: number; youtubeVideoId?: string }) {
    const metrics = await analyticsFeedbackService.captureVideoMetrics(input.projectId, input.userId);
    const retention = input.youtubeVideoId
      ? await getAudienceRetention(input.youtubeVideoId)
      : { averageRetention: 0, retentionCurve: [], dropoffPoints: [] };

    const learningSnapshot = input.nicheId
      ? await analyticsFeedbackService.getTopicLearningSnapshot(input.nicheId, input.userId)
      : null;

    const winLoseTag =
      metrics.views >= 10000 || metrics.ctr >= 6 || retention.averageRetention >= 55 ? "WIN" : "LOSE";

    let scalingAction: { triggered: boolean; reason: string; inserted?: number } | null = null;
    if (winLoseTag === "WIN" && input.nicheId) {
      const rapid = await topicRapidGenerator.generateRapidTopics({
        nicheId: input.nicheId,
        userId: input.userId,
        count: 100,
      });
      const similar = await topicMiningService.mineAndQueueTopics({
        nicheId: input.nicheId,
        userId: input.userId,
        limit: Math.max(10, Math.min(20, rapid.selectedTopics.length)),
      });
      scalingAction = {
        triggered: true,
        reason: "Winning video exceeded speed-to-scale threshold.",
        inserted: similar.inserted,
      };
    } else if (winLoseTag === "LOSE" && input.nicheId) {
      await decisionEngine.recordFailurePattern({
        userId: input.userId,
        nicheId: input.nicheId,
        topic: metrics.title,
        reason: "Below retention/CTR/view threshold",
      });
      scalingAction = {
        triggered: false,
        reason: "Pattern marked as fail and blocked from future replication.",
      };
    }

    return {
      metrics,
      retention: retention.averageRetention,
      tag: winLoseTag,
      learningSnapshot,
      scalingAction,
    };
  },
};
