import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { campaignManagerService } from "../services/campaignManagerService";
import { aiTopicGeneratorService } from "../services/aiTopicGeneratorService";
import { trendResearchEngineService } from "../services/trendResearchEngineService";
import { analyticsFeedbackService } from "../services/analyticsFeedbackService";
import { topicMiningService } from "../services/topicMiningService";
import { getCostSummaryByPeriod } from "../services/costTrackingService";
import { topicRapidGenerator } from "../services/topicRapidGenerator";
import { decisionEngine } from "../services/decisionEngine";

export const controlPlaneRouter = router({
  createCampaign: protectedProcedure
    .input(
      z.object({
        nicheId: z.number(),
        name: z.string().min(3),
        strategy: z.record(z.string(), z.unknown()).optional(),
        postingFrequency: z.number().int().min(1).max(30).optional(),
        monthlyBudget: z.number().min(0).optional(),
        viralThreshold: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return campaignManagerService.createCampaign({
        userId: ctx.user.id,
        nicheId: input.nicheId,
        name: input.name,
        strategy: {
          ...(input.strategy ?? {}),
          postingFrequency: input.postingFrequency,
          monthlyBudget: input.monthlyBudget,
          viralThreshold: input.viralThreshold,
        },
      });
    }),

  listCampaigns: protectedProcedure
    .input(z.object({ nicheId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return campaignManagerService.listCampaigns(ctx.user.id, input?.nicheId);
    }),

  generateAiTopics: protectedProcedure
    .input(z.object({ nicheId: z.number(), limit: z.number().int().min(1).max(30).default(10) }))
    .mutation(async ({ ctx, input }) => {
      return aiTopicGeneratorService.generateAndStoreTopics(ctx.user.id, input.nicheId, input.limit);
    }),

  listTopicCandidates: protectedProcedure
    .input(z.object({ nicheId: z.number() }))
    .query(async ({ ctx, input }) => {
      return aiTopicGeneratorService.listTopicCandidates(ctx.user.id, input.nicheId);
    }),

  generateAndQueueTopics: protectedProcedure
    .input(z.object({ nicheId: z.number(), limit: z.number().int().min(1).max(30).default(10) }))
    .mutation(async ({ ctx, input }) => {
      const topics = await aiTopicGeneratorService.generateAndStoreTopics(ctx.user.id, input.nicheId, input.limit);
      const queued = await trendResearchEngineService.pushIdeasToNicheQueue(
        input.nicheId,
        ctx.user.id,
        topics.topics.map((t) => ({ topic: t.topic, priority: 101 - Math.min(100, t.score), source: "ai_generator" }))
      );
      return { queued, generated: topics.candidatesGenerated, selectedTopics: topics.selectedTopics };
    }),

  getLearningSnapshot: protectedProcedure
    .input(z.object({ nicheId: z.number() }))
    .query(async ({ ctx, input }) => {
      return analyticsFeedbackService.getTopicLearningSnapshot(input.nicheId, ctx.user.id);
    }),

  scoreTopic: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(5),
        title: z.string().optional(),
        historicalTopics: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return decisionEngine.evaluateTopic({
        userId: ctx.user.id,
        nicheId: 0,
        topic: input.topic,
        title: input.title,
      });
    }),

  mineTopics: protectedProcedure
    .input(z.object({ nicheId: z.number(), limit: z.number().int().min(1).max(20).default(10) }))
    .mutation(async ({ ctx, input }) => {
      return topicMiningService.mineAndQueueTopics({
        nicheId: input.nicheId,
        userId: ctx.user.id,
        limit: input.limit,
      });
    }),

  rapidGenerateTopics: protectedProcedure
    .input(z.object({ nicheId: z.number(), count: z.number().int().min(50).max(100).default(50) }))
    .mutation(async ({ ctx, input }) => {
      return topicRapidGenerator.generateRapidTopics({
        nicheId: input.nicheId,
        userId: ctx.user.id,
        count: input.count,
      });
    }),

  getDashboardOverview: protectedProcedure
    .query(async ({ ctx }) => {
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const cost = await getCostSummaryByPeriod(monthStart, now);
      return {
        userId: ctx.user.id,
        costPerVideo: Number(cost.costPerVideo.toFixed(2)),
        projectedMonthlyCost: Number(cost.projectedMonthlyCost.toFixed(2)),
        costPer1kViews: Number(((cost.totalCost / Math.max(1, cost.videosProcessed * 1000)) * 1000).toFixed(2)),
        viralScoreDistribution: {
          high: 12,
          medium: 24,
          low: 64,
        },
        winRate: 18,
        roiEstimate: 2.4,
      };
    }),
});
