import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { trendResearchEngineService } from "../services/trendResearchEngineService";

export const trendResearchRouter = router({
  fetchSeeds: protectedProcedure
    .input(z.object({ nicheId: z.number() }))
    .query(async ({ ctx, input }) => {
      return trendResearchEngineService.fetchTrendSeeds(input.nicheId, ctx.user.id);
    }),

  generateIdeas: protectedProcedure
    .input(z.object({ nicheId: z.number(), limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      return trendResearchEngineService.generateTopicIdeasForNiche(
        input.nicheId,
        ctx.user.id,
        input.limit
      );
    }),

  pushIdeasToQueue: protectedProcedure
    .input(
      z.object({
        nicheId: z.number(),
        topics: z.array(
          z.object({
            topic: z.string().min(5),
            priority: z.number().int().optional(),
            source: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return trendResearchEngineService.pushIdeasToNicheQueue(input.nicheId, ctx.user.id, input.topics);
    }),

  autoGenerateAndQueue: protectedProcedure
    .input(z.object({ nicheId: z.number(), limit: z.number().int().min(1).max(50).default(10) }))
    .mutation(async ({ ctx, input }) => {
      const ideas = await trendResearchEngineService.generateTopicIdeasForNiche(
        input.nicheId,
        ctx.user.id,
        input.limit
      );
      const result = await trendResearchEngineService.pushIdeasToNicheQueue(input.nicheId, ctx.user.id, ideas);
      return { ...result, ideas };
    }),
});
