import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { campaignManagerService } from "../services/campaignManagerService";
import { aiTopicGeneratorService } from "../services/aiTopicGeneratorService";
import { trendResearchEngineService } from "../services/trendResearchEngineService";

export const controlPlaneRouter = router({
  createCampaign: protectedProcedure
    .input(
      z.object({
        nicheId: z.number(),
        name: z.string().min(3),
        strategy: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return campaignManagerService.createCampaign({
        userId: ctx.user.id,
        nicheId: input.nicheId,
        name: input.name,
        strategy: input.strategy,
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
        topics.map((t) => ({ topic: t.topic, priority: 101 - Math.min(100, t.score), source: "ai_generator" }))
      );
      return { queued, generated: topics.length };
    }),
});
