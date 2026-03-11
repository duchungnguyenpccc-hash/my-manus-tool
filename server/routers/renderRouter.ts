import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { renderVideo, getRenderJobStatus, cancelRenderJob } from "../services/creatomateService";
import { getApiKey, hasApiKey } from "../utils/apiKeyDb";
import { getDb } from "../db";
import { workflowTasks, videoProjects } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { eq } from "drizzle-orm";

export const renderRouter = router({
  /**
   * Render final video from clips and audio
   */
  renderVideo: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int(),
        taskId: z.number().int().optional(),
        videoClips: z.array(
          z.object({
            url: z.string().url(),
            duration: z.number().optional(),
            startTime: z.number().optional(),
          })
        ),
        audioTracks: z
          .array(
            z.object({
              url: z.string().url(),
              startTime: z.number().optional(),
            })
          )
          .optional(),
        textOverlays: z
          .array(
            z.object({
              text: z.string(),
              fontSize: z.number().optional(),
              color: z.string().optional(),
              startTime: z.number().optional(),
              duration: z.number().optional(),
            })
          )
          .optional(),
        width: z.number().int().default(1920),
        height: z.number().int().default(1080),
        duration: z.number().int().optional(),
        outputFormat: z.enum(["mp4", "webm", "gif"]).default("mp4"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user has Creatomate API key
      const hasKey = await hasApiKey(ctx.user.id, "creatomate");
      if (!hasKey) {
        throw new Error("Creatomate API key not configured. Please add it in settings.");
      }

      try {
        const apiKey = await getApiKey(ctx.user.id, "creatomate");
        if (!apiKey) {
          throw new Error("Failed to retrieve Creatomate key");
        }

        // Verify project ownership
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const project = await db
          .select()
          .from(videoProjects)
          .where(eq(videoProjects.id, input.projectId))
          .limit(1);

        if (project.length === 0 || project[0].userId !== ctx.user.id) {
          throw new Error("Project not found or unauthorized");
        }

        // Render video
        const videoUrl = await renderVideo(apiKey, {
          width: input.width,
          height: input.height,
          duration: input.duration,
          videoClips: input.videoClips,
          audioTracks: input.audioTracks,
          textOverlays: input.textOverlays,
          outputFormat: input.outputFormat,
        });

        // If taskId provided, save to database
        if (input.taskId) {
          // Download and upload to S3
          const videoResponse = await fetch(videoUrl);
          const videoBuffer = await videoResponse.arrayBuffer();
          const s3Result = await storagePut(
            `${ctx.user.id}/projects/${input.projectId}/final-video/${Date.now()}.${input.outputFormat}`,
            Buffer.from(videoBuffer),
            `video/${input.outputFormat}`
          );

          // Update task
          await db
            .update(workflowTasks)
            .set({
              status: "completed",
              output: {
                videoUrl: s3Result.url,
                s3Key: s3Result.key,
                format: input.outputFormat,
              },
              completedAt: new Date(),
            })
            .where(eq(workflowTasks.id, input.taskId));

          // Update project with final video
          await db
            .update(videoProjects)
            .set({
              status: "completed",
              youtubeUrl: s3Result.url,
              updatedAt: new Date(),
            })
            .where(eq(videoProjects.id, input.projectId));
        }

        return {
          success: true,
          videoUrl: videoUrl,
        };
      } catch (error) {
        console.error("[Render] Error rendering video:", error);
        throw new Error(`Failed to render video: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Get render job status
   */
  getJobStatus: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Check if user has Creatomate API key
      const hasKey = await hasApiKey(ctx.user.id, "creatomate");
      if (!hasKey) {
        throw new Error("Creatomate API key not configured. Please add it in settings.");
      }

      try {
        const apiKey = await getApiKey(ctx.user.id, "creatomate");
        if (!apiKey) {
          throw new Error("Failed to retrieve Creatomate key");
        }

        const job = await getRenderJobStatus(apiKey, input.jobId);

        return {
          success: true,
          job,
        };
      } catch (error) {
        console.error("[Render] Error getting job status:", error);
        throw new Error(`Failed to get job status: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Cancel a render job
   */
  cancelJob: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user has Creatomate API key
      const hasKey = await hasApiKey(ctx.user.id, "creatomate");
      if (!hasKey) {
        throw new Error("Creatomate API key not configured. Please add it in settings.");
      }

      try {
        const apiKey = await getApiKey(ctx.user.id, "creatomate");
        if (!apiKey) {
          throw new Error("Failed to retrieve Creatomate key");
        }

        const cancelled = await cancelRenderJob(apiKey, input.jobId);

        return {
          success: cancelled,
          message: cancelled ? "Render job cancelled successfully" : "Failed to cancel render job",
        };
      } catch (error) {
        console.error("[Render] Error cancelling job:", error);
        throw new Error(`Failed to cancel job: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),
});
