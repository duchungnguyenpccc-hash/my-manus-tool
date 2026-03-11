import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { generateVideoScript, enhanceImagePrompts, generateVideoMetadata } from "../services/openaiService";
import { getApiKey, hasApiKey } from "../utils/apiKeyDb";
import { getDb } from "../db";
import { videoProjects, workflowTasks } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const scriptRouter = router({
  /**
   * Generate a video script from a topic
   */
  generate: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(10).max(500),
        sceneCount: z.number().int().min(3).max(20),
        videoDuration: z.number().int().min(30).max(600), // 30 seconds to 10 minutes
        language: z.string().default("English"),
        projectId: z.number().int().optional(), // If updating existing project
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user has OpenAI API key
      const hasKey = await hasApiKey(ctx.user.id, "openai");
      if (!hasKey) {
        throw new Error("OpenAI API key not configured. Please add it in settings.");
      }

      try {
        // Generate script using OpenAI
        const scriptOutput = await generateVideoScript({
          topic: input.topic,
          sceneCount: input.sceneCount,
          videoDuration: input.videoDuration,
          language: input.language,
        });

        // If projectId provided, save to database
        if (input.projectId) {
          const db = await getDb();
          if (!db) {
            throw new Error("Database not available");
          }

          // Verify project ownership
          const project = await db
            .select()
            .from(videoProjects)
            .where(eq(videoProjects.id, input.projectId))
            .limit(1);

          if (project.length === 0 || project[0].userId !== ctx.user.id) {
            throw new Error("Project not found or unauthorized");
          }

          // Create workflow task for script generation
          const taskResult = await db.insert(workflowTasks).values({
            projectId: input.projectId,
            taskType: "script",
            status: "completed",
            input: {
              topic: input.topic,
              sceneCount: input.sceneCount,
              videoDuration: input.videoDuration,
            },
            output: scriptOutput,
            completedAt: new Date(),
          });

          return {
            success: true,
            taskId: (taskResult as any).insertId || 0,
            script: scriptOutput,
          };
        }

        return {
          success: true,
          script: scriptOutput,
        };
      } catch (error) {
        console.error("[Script Generation] Error:", error);
        throw new Error(`Failed to generate script: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Enhance image prompts for better AI generation
   */
  enhancePrompts: protectedProcedure
    .input(
      z.object({
        prompts: z.array(z.string()).min(1).max(50),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user has OpenAI API key
      const hasKey = await hasApiKey(ctx.user.id, "openai");
      if (!hasKey) {
        throw new Error("OpenAI API key not configured. Please add it in settings.");
      }

      try {
        const enhanced = await enhanceImagePrompts(input.prompts);
        return {
          success: true,
          enhancedPrompts: enhanced,
        };
      } catch (error) {
        console.error("[Prompt Enhancement] Error:", error);
        throw new Error(`Failed to enhance prompts: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Generate video metadata (titles and descriptions)
   */
  generateMetadata: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(10).max(500),
        script: z.string().min(50).max(5000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user has OpenAI API key
      const hasKey = await hasApiKey(ctx.user.id, "openai");
      if (!hasKey) {
        throw new Error("OpenAI API key not configured. Please add it in settings.");
      }

      try {
        const metadata = await generateVideoMetadata(input.topic, input.script);
        return {
          success: true,
          metadata,
        };
      } catch (error) {
        console.error("[Metadata Generation] Error:", error);
        throw new Error(`Failed to generate metadata: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),
});
