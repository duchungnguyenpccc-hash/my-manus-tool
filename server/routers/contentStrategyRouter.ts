import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  generateContentIdeas,
  generateContentStrategy,
  analyzeAudience,
  generateHashtagStrategy,
  predictVideoPerformance,
  generateMonetizationRecommendations,
} from "../services/contentStrategyService";

export const contentStrategyRouter = router({
  /**
   * Generate content ideas based on topic and trends
   */
  generateIdeas: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(3),
        trendingTopics: z.array(z.string()),
        audienceSize: z.number().optional().default(1000000),
      })
    )
    .mutation(async ({ input }) => {
      return await generateContentIdeas(input.topic, input.trendingTopics, input.audienceSize);
    }),

  /**
   * Generate comprehensive content strategy
   */
  generateStrategy: protectedProcedure
    .input(
      z.object({
        mainTopic: z.string().min(3),
        trendingTopics: z.array(z.string()),
        competitorNames: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      return await generateContentStrategy(
        input.mainTopic,
        input.trendingTopics,
        input.competitorNames
      );
    }),

  /**
   * Analyze audience for a niche
   */
  analyzeAudience: protectedProcedure
    .input(
      z.object({
        niche: z.string().min(3),
      })
    )
    .mutation(async ({ input }) => {
      return await analyzeAudience(input.niche);
    }),

  /**
   * Generate hashtag strategy
   */
  generateHashtags: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(3),
        niche: z.string().min(3),
      })
    )
    .mutation(async ({ input }) => {
      return await generateHashtagStrategy(input.topic, input.niche);
    }),

  /**
   * Predict video performance
   */
  predictPerformance: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(3),
        niche: z.string().min(3),
        channelSize: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      return await predictVideoPerformance(input.topic, input.niche, input.channelSize);
    }),

  /**
   * Generate monetization recommendations
   */
  generateMonetizationTips: protectedProcedure
    .input(
      z.object({
        niche: z.string().min(3),
      })
    )
    .mutation(async ({ input }) => {
      return await generateMonetizationRecommendations(input.niche);
    }),
});
