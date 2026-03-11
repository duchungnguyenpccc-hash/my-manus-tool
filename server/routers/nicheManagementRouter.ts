import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { nicheManagementService } from "../services/nicheManagementService";

export const nicheManagementRouter = router({
  // Create niche
  create: protectedProcedure
    .input(
      z.object({
        nicheName: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        targetAudience: z.record(z.string(), z.unknown()).optional(),
        performanceTargets: z.record(z.string(), z.unknown()).optional(),
        monetizationStrategy: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return nicheManagementService.createNiche(ctx.user.id, input);
    }),

  // Update niche
  update: protectedProcedure
    .input(
      z.object({
        nicheId: z.number(),
        updates: z.object({
          nicheName: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          targetAudience: z.record(z.string(), z.unknown()).optional(),
          performanceTargets: z.record(z.string(), z.unknown()).optional(),
          monetizationStrategy: z.record(z.string(), z.unknown()).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return nicheManagementService.updateNiche(input.nicheId, input.updates);
    }),

  // Delete niche
  delete: protectedProcedure
    .input(z.object({ nicheId: z.number() }))
    .mutation(async ({ input }) => {
      return nicheManagementService.deleteNiche(input.nicheId);
    }),

  // Get single niche
  get: protectedProcedure
    .input(z.object({ nicheId: z.number() }))
    .query(async ({ input }) => {
      return nicheManagementService.getNiche(input.nicheId);
    }),

  // List all niches for user
  list: protectedProcedure.query(async ({ ctx }) => {
    return nicheManagementService.listNiches(ctx.user.id);
  }),

  // Add channel to niche
  addChannel: protectedProcedure
    .input(
      z.object({
        nicheId: z.number(),
        youtubeChannelId: z.string(),
        channelName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return nicheManagementService.addChannelToNiche(
        input.nicheId,
        input.youtubeChannelId,
        input.channelName
      );
    }),

  // Get niche performance
  getPerformance: protectedProcedure
    .input(
      z.object({
        nicheId: z.number(),
        days: z.number().optional().default(30),
      })
    )
    .query(async ({ input }) => {
      return nicheManagementService.getNichePerformance(input.nicheId, input.days);
    }),

  // Get recommended hooks for niche
  getHooks: protectedProcedure
    .input(z.object({ nicheId: z.number() }))
    .query(async ({ input }) => {
      return nicheManagementService.getRecommendedHooksForNiche(input.nicheId);
    }),

  // Get recommended thumbnail style
  getThumbnailStyle: protectedProcedure
    .input(z.object({ nicheId: z.number() }))
    .query(async ({ input }) => {
      return nicheManagementService.getRecommendedThumbnailStyleForNiche(
        input.nicheId
      );
    }),

  // Auto-optimize for niche
  autoOptimize: protectedProcedure
    .input(
      z.object({
        nicheId: z.number(),
        videoData: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ input }) => {
      return nicheManagementService.autoOptimizeForNiche(
        input.nicheId,
        input.videoData
      );
    }),

  // Get niche trends
  getTrends: protectedProcedure
    .input(z.object({ nicheId: z.number() }))
    .query(async ({ input }) => {
      return nicheManagementService.getNicheTrends(input.nicheId);
    }),

  // Get niche audience profile
  getAudience: protectedProcedure
    .input(z.object({ nicheId: z.number() }))
    .query(async ({ input }) => {
      return nicheManagementService.getNicheAudience(input.nicheId);
    }),
});
