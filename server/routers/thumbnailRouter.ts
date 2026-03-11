import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  generateThumbnailDesigns,
  analyzeCompetitorThumbnails,
  predictThumbnailCTR,
  generateABTestVariations,
  getNicheDesignRecommendations,
} from "../services/thumbnailOptimizerService";

export const thumbnailRouter = router({
  generateDesigns: protectedProcedure
    .input(
      z.object({
        topic: z.string(),
        niche: z.string(),
        count: z.number().optional().default(3),
      })
    )
    .mutation(async ({ input }) => {
      return await generateThumbnailDesigns(input.topic, input.niche, input.count);
    }),

  analyzeCompetitors: protectedProcedure
    .input(
      z.object({
        topic: z.string(),
        niche: z.string(),
        competitorChannels: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      return await analyzeCompetitorThumbnails(
        input.topic,
        input.niche,
        input.competitorChannels
      );
    }),

  predictCTR: protectedProcedure
    .input(
      z.object({
        design: z.object({
          title: z.string(),
          description: z.string(),
          colorScheme: z.object({
            primary: z.string(),
            secondary: z.string(),
            accent: z.string(),
            textColor: z.string(),
          }),
          textSuggestions: z.array(z.string()),
          designElements: z.array(z.string()),
          emotionTriggers: z.array(z.string()),
          predictedCTR: z.number(),
          reasoning: z.string(),
        }),
        baselineCTR: z.number().optional().default(4.5),
      })
    )
    .mutation(async ({ input }) => {
      return await predictThumbnailCTR(input.design, input.baselineCTR);
    }),

  generateABTestVariations: protectedProcedure
    .input(
      z.object({
        baseDesign: z.object({
          title: z.string(),
          description: z.string(),
          colorScheme: z.object({
            primary: z.string(),
            secondary: z.string(),
            accent: z.string(),
            textColor: z.string(),
          }),
          textSuggestions: z.array(z.string()),
          designElements: z.array(z.string()),
          emotionTriggers: z.array(z.string()),
          predictedCTR: z.number(),
          reasoning: z.string(),
        }),
        variationCount: z.number().optional().default(3),
      })
    )
    .mutation(async ({ input }) => {
      return await generateABTestVariations(input.baseDesign, input.variationCount);
    }),

  getNicheRecommendations: protectedProcedure
    .input(
      z.object({
        niche: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getNicheDesignRecommendations(input.niche);
    }),
});
