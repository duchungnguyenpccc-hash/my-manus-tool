import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  generateHookVariations,
  getHookStrategies,
  analyzeHooks,
  generateHookABTestVariations,
  getCompleteHookAnalysis,
  generateHooksWithCompetitorAnalysis,
} from "../services/enhancedHookGeneratorService";

export const hookGeneratorRouter = router({
  generateVariations: protectedProcedure
    .input(
      z.object({
        topic: z.string(),
        niche: z.string(),
        count: z.number().optional().default(10),
      })
    )
    .mutation(async ({ input }) => {
      return await generateHookVariations(input.topic, input.niche, input.count);
    }),

  getStrategies: protectedProcedure
    .input(
      z.object({
        niche: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getHookStrategies(input.niche);
    }),

  analyzeHooks: protectedProcedure
    .input(
      z.object({
        hooks: z.array(z.string()),
        topic: z.string(),
        niche: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await analyzeHooks(input.hooks, input.topic, input.niche);
    }),

  generateABTestVariations: protectedProcedure
    .input(
      z.object({
        baseHook: z.string(),
        topic: z.string(),
        variationCount: z.number().optional().default(5),
      })
    )
    .mutation(async ({ input }) => {
      return await generateHookABTestVariations(
        input.baseHook,
        input.topic,
        input.variationCount
      );
    }),

  getCompleteAnalysis: protectedProcedure
    .input(
      z.object({
        topic: z.string(),
        niche: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await getCompleteHookAnalysis(input.topic, input.niche);
    }),

  generateWithCompetitorAnalysis: protectedProcedure
    .input(
      z.object({
        topic: z.string(),
        niche: z.string(),
        competitorChannels: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      return await generateHooksWithCompetitorAnalysis(
        input.topic,
        input.niche,
        input.competitorChannels
      );
    }),
});
