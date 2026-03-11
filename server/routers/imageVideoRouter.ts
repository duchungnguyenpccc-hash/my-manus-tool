import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { generateImage, generateVideoFromImage, generateImageBatch, generateVideoBatch } from "../services/piapiService";
import { getApiKey, hasApiKey } from "../utils/apiKeyDb";
import { getDb } from "../db";
import { generatedAssets, workflowTasks } from "../../drizzle/schema";
import { storagePut } from "../storage";

export const imageVideoRouter = router({
  /**
   * Generate a single image from text prompt
   */
  generateImage: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(10).max(1000),
        model: z.enum(["qwen", "flux1-schnell"]).default("qwen"),
        projectId: z.number().int().optional(),
        taskId: z.number().int().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user has PiAPI key
      const hasKey = await hasApiKey(ctx.user.id, "piapi");
      if (!hasKey) {
        throw new Error("PiAPI key not configured. Please add it in settings.");
      }

      try {
        const apiKey = await getApiKey(ctx.user.id, "piapi");
        if (!apiKey) {
          throw new Error("Failed to retrieve PiAPI key");
        }

        // Generate image
        const imageUrl = await generateImage(apiKey, input.prompt, {
          model: input.model,
        });

        // If taskId provided, save to database
        if (input.taskId && input.projectId) {
          const db = await getDb();
          if (!db) {
            throw new Error("Database not available");
          }

          // Upload to S3
          const imageResponse = await fetch(imageUrl);
          const imageBuffer = await imageResponse.arrayBuffer();
          const s3Result = await storagePut(
            `${ctx.user.id}/projects/${input.projectId}/images/${Date.now()}.png`,
            Buffer.from(imageBuffer),
            "image/png"
          );

          // Save asset record
          await db.insert(generatedAssets).values({
            taskId: input.taskId,
            projectId: input.projectId,
            assetType: "image",
            s3Key: s3Result.key,
            s3Url: s3Result.url,
            metadata: {
              originalUrl: imageUrl,
              model: input.model,
              prompt: input.prompt,
            },
          });

          // Update task
          await db
            .update(workflowTasks)
            .set({
              status: "completed",
              output: {
                imageUrl: s3Result.url,
                s3Key: s3Result.key,
              },
              completedAt: new Date(),
            })
            .where(eq(workflowTasks.id, input.taskId));
        }

        return {
          success: true,
          imageUrl,
        };
      } catch (error) {
        console.error("[Image Generation] Error:", error);
        throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Generate video from image
   */
  generateVideo: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        prompt: z.string().min(5).max(500).optional(),
        model: z.enum(["veo3-image-to-video", "kling-image-to-video"]).default("veo3-image-to-video"),
        duration: z.number().int().min(3).max(30).default(5),
        projectId: z.number().int().optional(),
        taskId: z.number().int().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user has PiAPI key
      const hasKey = await hasApiKey(ctx.user.id, "piapi");
      if (!hasKey) {
        throw new Error("PiAPI key not configured. Please add it in settings.");
      }

      try {
        const apiKey = await getApiKey(ctx.user.id, "piapi");
        if (!apiKey) {
          throw new Error("Failed to retrieve PiAPI key");
        }

        // Generate video
        const videoUrl = await generateVideoFromImage(apiKey, input.imageUrl, {
          prompt: input.prompt,
          model: input.model,
          duration: input.duration,
        });

        // If taskId provided, save to database
        if (input.taskId && input.projectId) {
          const db = await getDb();
          if (!db) {
            throw new Error("Database not available");
          }

          // Download and upload to S3
          const videoResponse = await fetch(videoUrl);
          const videoBuffer = await videoResponse.arrayBuffer();
          const s3Result = await storagePut(
            `${ctx.user.id}/projects/${input.projectId}/videos/clips/${Date.now()}.mp4`,
            Buffer.from(videoBuffer),
            "video/mp4"
          );

          // Save asset record
          await db.insert(generatedAssets).values({
            taskId: input.taskId,
            projectId: input.projectId,
            assetType: "video",
            s3Key: s3Result.key,
            s3Url: s3Result.url,
            metadata: {
              originalUrl: videoUrl,
              model: input.model,
              duration: input.duration,
              prompt: input.prompt,
            },
          });

          // Update task
          await db
            .update(workflowTasks)
            .set({
              status: "completed",
              output: {
                videoUrl: s3Result.url,
                s3Key: s3Result.key,
              },
              completedAt: new Date(),
            })
            .where(eq(workflowTasks.id, input.taskId));
        }

        return {
          success: true,
          videoUrl,
        };
      } catch (error) {
        console.error("[Video Generation] Error:", error);
        throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Batch generate images
   */
  generateImageBatch: protectedProcedure
    .input(
      z.object({
        prompts: z.array(z.string()).min(1).max(20),
        model: z.enum(["qwen", "flux1-schnell"]).default("qwen"),
        projectId: z.number().int().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user has PiAPI key
      const hasKey = await hasApiKey(ctx.user.id, "piapi");
      if (!hasKey) {
        throw new Error("PiAPI key not configured. Please add it in settings.");
      }

      try {
        const apiKey = await getApiKey(ctx.user.id, "piapi");
        if (!apiKey) {
          throw new Error("Failed to retrieve PiAPI key");
        }

        // Generate images
        const imageUrls = await generateImageBatch(apiKey, input.prompts, {
          model: input.model,
        });

        return {
          success: true,
          imageUrls,
          count: imageUrls.length,
        };
      } catch (error) {
        console.error("[Batch Image Generation] Error:", error);
        throw new Error(`Failed to generate images: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Batch generate videos from images
   */
  generateVideoBatch: protectedProcedure
    .input(
      z.object({
        imageUrls: z.array(z.string().url()).min(1).max(20),
        model: z.enum(["veo3-image-to-video", "kling-image-to-video"]).default("veo3-image-to-video"),
        duration: z.number().int().min(3).max(30).default(5),
        projectId: z.number().int().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user has PiAPI key
      const hasKey = await hasApiKey(ctx.user.id, "piapi");
      if (!hasKey) {
        throw new Error("PiAPI key not configured. Please add it in settings.");
      }

      try {
        const apiKey = await getApiKey(ctx.user.id, "piapi");
        if (!apiKey) {
          throw new Error("Failed to retrieve PiAPI key");
        }

        // Generate videos
        const videoUrls = await generateVideoBatch(apiKey, input.imageUrls, {
          model: input.model,
          duration: input.duration,
        });

        return {
          success: true,
          videoUrls,
          count: videoUrls.length,
        };
      } catch (error) {
        console.error("[Batch Video Generation] Error:", error);
        throw new Error(`Failed to generate videos: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),
});
