import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as qualityControlService from "../services/qualityControlService";
import * as costTrackingService from "../services/costTrackingService";
import * as contentFingerprintingService from "../services/contentFingerprintingService";

export const qualityControlRouter = router({
  // Quality Control Procedures
  performFullQualityCheck: protectedProcedure
    .input(
      z.object({
        videoId: z.string(),
        hook: z.string(),
        script: z.string(),
        title: z.string(),
        thumbnailUrl: z.string(),
        audioUrl: z.string(),
        category: z.string(),
        tags: z.array(z.string()),
      })
    )
    .mutation(async ({ input }: any) => {
      return await qualityControlService.performFullQualityCheck(input);
    }),

  assessHookQuality: protectedProcedure
    .input(z.object({ hook: z.string() }))
    .query(async ({ input }: any) => {
      return await qualityControlService.assessHookQuality(input.hook);
    }),

  assessScriptQuality: protectedProcedure
    .input(z.object({ script: z.string() }))
    .query(async ({ input }: any) => {
      return await qualityControlService.assessScriptQuality(input.script);
    }),

  assessThumbnailQuality: protectedProcedure
    .input(z.object({ thumbnailUrl: z.string() }))
    .query(async ({ input }: any) => {
      return await qualityControlService.assessThumbnailQuality(input.thumbnailUrl);
    }),

  predictVideoPerformance: protectedProcedure
    .input(
      z.object({
        hook: z.string(),
        title: z.string(),
        category: z.string(),
        tags: z.array(z.string()),
      })
    )
    .query(async ({ input }: any) => {
      return await qualityControlService.predictVideoPerformance(
        input.hook,
        input.title,
        input.category,
        input.tags
      );
    }),

  getQualityCheckHistory: protectedProcedure
    .input(z.object({ channelId: z.string(), limit: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await qualityControlService.getQualityCheckHistory(input.channelId, input.limit);
    }),

  getQualityMetricsSummary: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }: any) => {
      return await qualityControlService.getQualityMetricsSummary(input.channelId);
    }),

  autoOptimizeVideo: protectedProcedure
    .input(z.object({ videoData: z.any(), qcResult: z.any() }))
    .mutation(async ({ input }: any) => {
      return await qualityControlService.autoOptimizeVideo(input.videoData, input.qcResult);
    }),

  // Cost Tracking Procedures
  getVideoCostSummary: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ input }: any) => {
      return await costTrackingService.getVideoCostSummary(input.videoId);
    }),

  getCostSummaryByPeriod: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        channelId: z.string().optional(),
      })
    )
    .query(async ({ input }: any) => {
      return await costTrackingService.getCostSummaryByPeriod(
        input.startDate,
        input.endDate,
        input.channelId
      );
    }),

  getOptimizationRecommendations: protectedProcedure.query(async () => {
    return await costTrackingService.getOptimizationRecommendations();
  }),

  optimizeWithBatching: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        topic: z.string(),
        category: z.string(),
        trendingHooks: z.array(z.string()),
      })
    )
    .mutation(async ({ input }: any) => {
      return await costTrackingService.optimizeWithBatching(input);
    }),

  optimizeWithMultiModel: protectedProcedure
    .input(z.object({ operation: z.string(), complexity: z.enum(["high", "medium", "low"]) }))
    .query(async ({ input }: any) => {
      return await costTrackingService.optimizeWithMultiModel(input.operation, input.complexity);
    }),

  getCostBreakdownByOperation: protectedProcedure.query(async () => {
    return await costTrackingService.getCostBreakdownByOperation();
  }),

  estimateScalingCost: protectedProcedure
    .input(z.object({ videosPerDay: z.number() }))
    .query(async ({ input }: any) => {
      return await costTrackingService.estimateScalingCost(input.videosPerDay);
    }),

  getROIAnalysis: protectedProcedure
    .input(
      z.object({
        videosPerDay: z.number(),
        avgViewsPerVideo: z.number(),
        ctrPercentage: z.number(),
        revenuePerClick: z.number(),
      })
    )
    .query(async ({ input }: any) => {
      return await costTrackingService.getROIAnalysis(
        input.videosPerDay,
        input.avgViewsPerVideo,
        input.ctrPercentage,
        input.revenuePerClick
      );
    }),

  // Content Fingerprinting Procedures
  checkContentDuplicate: protectedProcedure
    .input(
      z.object({
        videoUrl: z.string(),
        script: z.string(),
        channelId: z.string(),
      })
    )
    .mutation(async ({ input }: any) => {
      return await contentFingerprintingService.checkContentDuplicate(
        input.videoUrl,
        input.script,
        input.channelId
      );
    }),

  checkScriptSimilarity: protectedProcedure
    .input(z.object({ script: z.string(), category: z.string() }))
    .query(async ({ input }: any) => {
      return await contentFingerprintingService.checkScriptSimilarity(input.script, input.category);
    }),

  checkCompliance: protectedProcedure
    .input(
      z.object({
        script: z.string(),
        title: z.string(),
        tags: z.array(z.string()),
      })
    )
    .query(async ({ input }: any) => {
      return await contentFingerprintingService.checkCompliance(input.script, input.title, input.tags);
    }),

  performFullContentCheck: protectedProcedure
    .input(
      z.object({
        videoUrl: z.string(),
        script: z.string(),
        title: z.string(),
        tags: z.array(z.string()),
        category: z.string(),
        channelId: z.string(),
      })
    )
    .mutation(async ({ input }: any) => {
      return await contentFingerprintingService.performFullContentCheck(
        input.videoUrl,
        input.script,
        input.title,
        input.tags,
        input.category,
        input.channelId
      );
    }),

  getContentCheckHistory: protectedProcedure
    .input(z.object({ channelId: z.string(), limit: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await contentFingerprintingService.getContentCheckHistory(input.channelId, input.limit);
    }),

  getComplianceSummary: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }: any) => {
      return await contentFingerprintingService.getComplianceSummary(input.channelId);
    }),
});
