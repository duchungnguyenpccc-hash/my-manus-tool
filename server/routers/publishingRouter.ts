import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  publishToYouTube,
  batchPublish,
  retryFailedPublish,
  getPublishingStatus,
  schedulePublish,
  cancelScheduledPublish,
  type PublishingTask,
} from "../services/publishingAgent";

/**
 * Publishing Router
 * Handles video publishing to YouTube and result tracking
 */

export const publishingRouter = router({
  /**
   * Publish a single video to YouTube
   */
  publish: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        videoUrl: z.string().url(),
        title: z.string().min(1),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        privacyStatus: z.enum(["public", "unlisted", "private"]).optional(),
        sheetsConfig: z
          .object({
            spreadsheetId: z.string(),
            sheetName: z.string(),
            topicId: z.string(),
          })
          .optional(),
        playlistId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const task: PublishingTask = {
        projectId: input.projectId,
        userId: ctx.user.id,
        videoUrl: input.videoUrl,
        title: input.title,
        description: input.description || "",
        tags: input.tags || [],
        privacyStatus: input.privacyStatus || "public",
        sheetsConfig: input.sheetsConfig,
        playlistId: input.playlistId,
      };

      return await publishToYouTube(task);
    }),

  /**
   * Batch publish multiple videos
   */
  batchPublish: protectedProcedure
    .input(
      z.array(
        z.object({
          projectId: z.number(),
          videoUrl: z.string().url(),
          title: z.string().min(1),
          description: z.string().optional(),
          tags: z.array(z.string()).optional(),
          privacyStatus: z.enum(["public", "unlisted", "private"]).optional(),
        })
      )
    )
    .mutation(async ({ input, ctx }) => {
      const tasks: PublishingTask[] = input.map((item) => ({
        projectId: item.projectId,
        userId: ctx.user.id,
        videoUrl: item.videoUrl,
        title: item.title,
        description: item.description || "",
        tags: item.tags || [],
        privacyStatus: item.privacyStatus || "public",
      }));

      return await batchPublish(tasks);
    }),

  /**
   * Retry failed publish
   */
  retryFailed: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await retryFailedPublish(input.projectId, ctx.user.id);
    }),

  /**
   * Get publishing status
   */
  getStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getPublishingStatus(input.projectId);
    }),

  /**
   * Schedule publish for later
   */
  schedule: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        videoUrl: z.string().url(),
        title: z.string().min(1),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        scheduleTime: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const task: PublishingTask = {
        projectId: input.projectId,
        userId: ctx.user.id,
        videoUrl: input.videoUrl,
        title: input.title,
        description: input.description || "",
        tags: input.tags || [],
      };

      return await schedulePublish(task, input.scheduleTime);
    }),

  /**
   * Cancel scheduled publish
   */
  cancelScheduled: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await cancelScheduledPublish(input.projectId);
    }),
});
