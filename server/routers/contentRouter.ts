import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TitleGenerationService } from "../services/titleGenerationService";
import { ContentModerationService } from "../services/contentModerationService";
import { AssetCompositionService } from "../services/assetCompositionService";

export const contentRouter = router({
  // Title Generation Procedures
  title: router({
    generate: protectedProcedure
      .input(z.object({ topic: z.string().min(1) }))
      .mutation(async ({ input }: { input: any }) => {
        return await TitleGenerationService.generateTitles(input.topic);
      }),

    variations: protectedProcedure
      .input(
        z.object({
          topic: z.string().min(1),
          count: z.number().int().min(1).max(10).default(3),
        })
      )
      .mutation(async ({ input }: { input: any }) => {
        return await TitleGenerationService.generateTitleVariations(
          input.topic,
          input.count
        );
      }),

    optimizeForPlatform: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          platform: z.enum(["youtube", "tiktok", "instagram", "twitter"]),
        })
      )
      .mutation(async ({ input }: { input: any }) => {
        return await TitleGenerationService.optimizeTitleForPlatform(
          input.title,
          input.platform
        );
      }),
  }),

  // Content Moderation Procedures
  moderation: router({
    moderate: protectedProcedure
      .input(z.object({ content: z.string().min(1) }))
      .mutation(async ({ input }: { input: any }) => {
        return await ContentModerationService.moderateContent(input.content);
      }),

    moderateMultiple: protectedProcedure
      .input(z.object({ contents: z.array(z.string().min(1)) }))
      .mutation(async ({ input }: { input: any }) => {
        return await ContentModerationService.moderateMultiple(input.contents);
      }),

    isApproved: protectedProcedure
      .input(z.object({ content: z.string().min(1) }))
      .query(async ({ input }: { input: any }) => {
        return await ContentModerationService.isContentApproved(input.content);
      }),

    getScore: protectedProcedure
      .input(z.object({ content: z.string().min(1) }))
      .query(async ({ input }: { input: any }) => {
        return await ContentModerationService.getModerationScore(input.content);
      }),

    getReport: protectedProcedure
      .input(z.object({ content: z.string().min(1) }))
      .query(async ({ input }: { input: any }) => {
        return await ContentModerationService.getModerationReport(input.content);
      }),
  }),

  // Asset Composition Procedures
  composition: router({
    compose: protectedProcedure
      .input(
        z.object({
          images: z.array(
            z.object({
              id: z.string(),
              type: z.literal("image"),
              url: z.string().url(),
              order: z.number(),
              metadata: z.record(z.string(), z.unknown()).optional(),
            })
          ),
          videos: z.array(
            z.object({
              id: z.string(),
              type: z.literal("video"),
              url: z.string().url(),
              duration: z.number().optional(),
              order: z.number(),
              metadata: z.record(z.string(), z.unknown()).optional(),
            })
          ),
          audio: z.object({
            id: z.string(),
            type: z.literal("audio"),
            url: z.string().url(),
            duration: z.number(),
            order: z.number().optional(),
            metadata: z.record(z.string(), z.unknown()).optional(),
          }),
          script: z.string(),
        })
      )
      .mutation(async ({ input }: { input: any }) => {
        return AssetCompositionService.composeAssets(
          input.images,
          input.videos,
          input.audio,
          input.script
        );
      }),

    validate: protectedProcedure
      .input(
        z.object({
          composition: z.object({
            elements: z.array(z.unknown()),
            totalDuration: z.number(),
            resolution: z.object({ width: z.number(), height: z.number() }),
            fps: z.number(),
            audioTrack: z.string().optional(),
          }),
        })
      )
      .query(async ({ input }: { input: any }) => {
        return AssetCompositionService.validateComposition(
          input.composition as never
        );
      }),

    getSummary: protectedProcedure
      .input(
        z.object({
          composition: z.object({
            elements: z.array(z.unknown()),
            totalDuration: z.number(),
            resolution: z.object({ width: z.number(), height: z.number() }),
            fps: z.number(),
            audioTrack: z.string().optional(),
          }),
        })
      )
      .query(async ({ input }: { input: any }) => {
        return AssetCompositionService.getSummary(input.composition as never);
      }),

    exportAsCreatomateScript: protectedProcedure
      .input(
        z.object({
          composition: z.object({
            elements: z.array(z.unknown()),
            totalDuration: z.number(),
            resolution: z.object({ width: z.number(), height: z.number() }),
            fps: z.number(),
            audioTrack: z.string().optional(),
          }),
          title: z.string().optional(),
        })
      )
      .query(async ({ input }: { input: any }) => {
        return AssetCompositionService.exportAsCreatomateScript(
          input.composition as never,
          input.title
        );
      }),
  }),
});
