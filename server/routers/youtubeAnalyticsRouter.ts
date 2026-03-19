import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as youtubeAnalyticsService from "../services/youtubeAnalyticsService";
import * as multiChannelService from "../services/multiChannelService";
import * as audienceSegmentationService from "../services/audienceSegmentationService";
import { analyticsFeedbackService } from "../services/analyticsFeedbackService";

export const youtubeAnalyticsRouter = router({
  // YouTube Analytics Procedures
  getVideoMetrics: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ input }: any) => {
      return await youtubeAnalyticsService.getVideoMetrics(input.videoId);
    }),

  getChannelMetrics: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }: any) => {
      return await youtubeAnalyticsService.getChannelMetrics(input.channelId);
    }),

  getAudienceDemographics: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }: any) => {
      return await youtubeAnalyticsService.getAudienceDemographics(input.channelId);
    }),

  getTrendingVideos: protectedProcedure
    .input(z.object({ category: z.string(), limit: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await youtubeAnalyticsService.getTrendingVideos(input.category, input.limit);
    }),

  compareVideoPerformance: protectedProcedure
    .input(z.object({ videoId1: z.string(), videoId2: z.string() }))
    .query(async ({ input }: any) => {
      return await youtubeAnalyticsService.compareVideoPerformance(input.videoId1, input.videoId2);
    }),

  predictVideoPerformance: protectedProcedure
    .input(z.object({ title: z.string(), tags: z.array(z.string()), category: z.string() }))
    .query(async ({ input }: any) => {
      return await youtubeAnalyticsService.predictVideoPerformance(input.title, input.tags, input.category);
    }),

  getRealtimeVideoStats: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ input }: any) => {
      return await youtubeAnalyticsService.getRealtimeVideoStats(input.videoId);
    }),

  getAudienceRetention: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ input }: any) => {
      return await youtubeAnalyticsService.getAudienceRetention(input.videoId);
    }),

  getContentPerformanceByTopic: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }: any) => {
      return await youtubeAnalyticsService.getContentPerformanceByTopic(input.channelId);
    }),

  getSubscriberGrowth: protectedProcedure
    .input(z.object({ channelId: z.string(), days: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await youtubeAnalyticsService.getSubscriberGrowth(input.channelId, input.days);
    }),

  getRevenueBreakdown: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }: any) => {
      return await youtubeAnalyticsService.getRevenueBreakdown(input.channelId);
    }),

  getWatchTimeAnalytics: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }: any) => {
      return await youtubeAnalyticsService.getWatchTimeAnalytics(input.channelId);
    }),



  captureProjectFeedback: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      return analyticsFeedbackService.captureVideoMetrics(input.projectId, Number(ctx.user.id));
    }),

  getNicheFeedback: protectedProcedure
    .input(z.object({ nicheId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      return analyticsFeedbackService.getNicheFeedback(input.nicheId, Number(ctx.user.id));
    }),
  // Multi-Channel Management Procedures
  getUserChannels: protectedProcedure.query(async ({ ctx }: any) => {
    return await multiChannelService.getUserChannels(String(ctx.user.id));
  }),

  getPrimaryChannel: protectedProcedure.query(async ({ ctx }: any) => {
    return await multiChannelService.getPrimaryChannel(String(ctx.user.id));
  }),

  addChannel: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        channelName: z.string(),
        accessToken: z.string(),
        refreshToken: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      return await multiChannelService.addChannel(
        String(ctx.user.id),
        input.channelId,
        input.channelName,
        input.accessToken,
        input.refreshToken
      );
    }),

  updateChannelSettings: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        settings: z.object({
          uploadSchedule: z.string().optional(),
          defaultQuality: z.enum(["high", "medium", "low"]).optional(),
          autoPublish: z.boolean().optional(),
          autoSchedule: z.boolean().optional(),
          defaultCategory: z.string().optional(),
          defaultLanguage: z.string().optional(),
          enableMonetization: z.boolean().optional(),
          enableComments: z.boolean().optional(),
          enableLikes: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }: any) => {
      return await multiChannelService.updateChannelSettings(input.channelId, input.settings);
    }),

  setPrimaryChannel: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      return await multiChannelService.setPrimaryChannel(String(ctx.user.id), input.channelId);
    }),

  disconnectChannel: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .mutation(async ({ input }: any) => {
      return await multiChannelService.disconnectChannel(input.channelId);
    }),

  getChannelPortfolio: protectedProcedure.query(async ({ ctx }: any) => {
    return await multiChannelService.getChannelPortfolio(String(ctx.user.id));
  }),

  syncChannelData: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .mutation(async ({ input }: any) => {
      return await multiChannelService.syncChannelData(input.channelId);
    }),

  getCrossChannelAnalytics: protectedProcedure.query(async ({ ctx }: any) => {
    return await multiChannelService.getCrossChannelAnalytics(String(ctx.user.id));
  }),

  getChannelHealthScore: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }: any) => {
      return await multiChannelService.getChannelHealthScore(input.channelId);
    }),

  // Audience Segmentation Procedures
  getAudienceSegments: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }: any) => {
      return await audienceSegmentationService.getAudienceSegments(input.channelId);
    }),

  getSegmentContentRecommendations: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }: any) => {
      return await audienceSegmentationService.getSegmentContentRecommendations(input.channelId);
    }),

  analyzeAudienceBehavior: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }: any) => {
      return await audienceSegmentationService.analyzeAudienceBehavior(input.channelId);
    }),

  getAudienceInsights: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }: any) => {
      return await audienceSegmentationService.getAudienceInsights(input.channelId);
    }),

  createCustomSegment: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        name: z.string(),
        criteria: z.object({
          ageRange: z.string().optional(),
          countries: z.array(z.string()).optional(),
          interests: z.array(z.string()).optional(),
          engagementLevel: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }: any) => {
      return await audienceSegmentationService.createCustomSegment(input.channelId, input.name, input.criteria);
    }),

  getPersonalizedContent: protectedProcedure
    .input(z.object({ segmentId: z.string() }))
    .query(async ({ input }: any) => {
      return await audienceSegmentationService.getPersonalizedContent(input.segmentId);
    }),

  predictSegmentGrowth: protectedProcedure
    .input(z.object({ channelId: z.string(), segmentId: z.string(), days: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await audienceSegmentationService.predictSegmentGrowth(input.channelId, input.segmentId, input.days);
    }),

  getSegmentEngagementMetrics: protectedProcedure
    .input(z.object({ segmentId: z.string() }))
    .query(async ({ input }: any) => {
      return await audienceSegmentationService.getSegmentEngagementMetrics(input.segmentId);
    }),
});
