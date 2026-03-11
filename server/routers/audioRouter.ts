import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  textToSpeech,
  getVoices,
  generateMultiSegmentAudio,
  estimateAudioDuration,
  validateApiKey,
} from "../services/elevenLabsService";
import { getApiKey, hasApiKey } from "../utils/apiKeyDb";
import { getDb } from "../db";
import { generatedAssets, workflowTasks } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { eq } from "drizzle-orm";

const VoicePresetEnum = z.enum(["adam", "bella", "charlie", "dorothy", "emily", "ethan", "george", "grace"]);

export const audioRouter = router({
  /**
   * Get available voices
   */
  getVoices: protectedProcedure.query(async ({ ctx }) => {
    // Check if user has ElevenLabs API key
    const hasKey = await hasApiKey(ctx.user.id, "elevenlabs");
    if (!hasKey) {
      throw new Error("ElevenLabs API key not configured. Please add it in settings.");
    }

    try {
      const apiKey = await getApiKey(ctx.user.id, "elevenlabs");
      if (!apiKey) {
        throw new Error("Failed to retrieve ElevenLabs key");
      }

      const voices = await getVoices(apiKey);

      return {
        success: true,
        voices: voices.map((v) => ({
          voiceId: v.voiceId,
          name: v.name,
          category: v.category,
        })),
      };
    } catch (error) {
      console.error("[Audio] Error getting voices:", error);
      throw new Error(`Failed to get voices: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }),

  /**
   * Generate speech from text
   */
  generateSpeech: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1).max(5000),
        voicePreset: VoicePresetEnum.default("bella"),
        projectId: z.number().int().optional(),
        taskId: z.number().int().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user has ElevenLabs API key
      const hasKey = await hasApiKey(ctx.user.id, "elevenlabs");
      if (!hasKey) {
        throw new Error("ElevenLabs API key not configured. Please add it in settings.");
      }

      try {
        const apiKey = await getApiKey(ctx.user.id, "elevenlabs");
        if (!apiKey) {
          throw new Error("Failed to retrieve ElevenLabs key");
        }

        // Generate speech
        const audioBuffer = await textToSpeech(apiKey, {
          text: input.text,
          voicePreset: input.voicePreset,
        });

        // If taskId provided, save to database
        if (input.taskId && input.projectId) {
          const db = await getDb();
          if (!db) {
            throw new Error("Database not available");
          }

          // Upload to S3
          const s3Result = await storagePut(
            `${ctx.user.id}/projects/${input.projectId}/audio/${Date.now()}.mp3`,
            audioBuffer,
            "audio/mpeg"
          );

          // Save asset record
          await db.insert(generatedAssets).values({
            taskId: input.taskId,
            projectId: input.projectId,
            assetType: "audio",
            s3Key: s3Result.key,
            s3Url: s3Result.url,
            metadata: {
              voice: input.voicePreset,
              duration: estimateAudioDuration(input.text),
              textLength: input.text.length,
            },
          });

          // Update task
          await db
            .update(workflowTasks)
            .set({
              status: "completed",
              output: {
                audioUrl: s3Result.url,
                s3Key: s3Result.key,
                duration: estimateAudioDuration(input.text),
              },
              completedAt: new Date(),
            })
            .where(eq(workflowTasks.id, input.taskId));
        }

        return {
          success: true,
          duration: estimateAudioDuration(input.text),
          size: audioBuffer.length,
        };
      } catch (error) {
        console.error("[Audio] Error generating speech:", error);
        throw new Error(`Failed to generate speech: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Generate speech from multiple segments
   */
  generateMultiSegmentSpeech: protectedProcedure
    .input(
      z.object({
        segments: z.array(
          z.object({
            text: z.string().min(1).max(1000),
            voicePreset: VoicePresetEnum.default("bella"),
          })
        ),
        projectId: z.number().int().optional(),
        taskId: z.number().int().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user has ElevenLabs API key
      const hasKey = await hasApiKey(ctx.user.id, "elevenlabs");
      if (!hasKey) {
        throw new Error("ElevenLabs API key not configured. Please add it in settings.");
      }

      try {
        const apiKey = await getApiKey(ctx.user.id, "elevenlabs");
        if (!apiKey) {
          throw new Error("Failed to retrieve ElevenLabs key");
        }

        // Generate audio for each segment
        const audioBuffers = await generateMultiSegmentAudio(
          apiKey,
          input.segments.map((s) => ({
            text: s.text,
            voicePreset: s.voicePreset,
          }))
        );

        // Combine buffers (simple concatenation)
        const combinedBuffer = Buffer.concat(audioBuffers);

        // If taskId provided, save to database
        if (input.taskId && input.projectId) {
          const db = await getDb();
          if (!db) {
            throw new Error("Database not available");
          }

          // Upload to S3
          const s3Result = await storagePut(
            `${ctx.user.id}/projects/${input.projectId}/audio/combined-${Date.now()}.mp3`,
            combinedBuffer,
            "audio/mpeg"
          );

          // Calculate total duration
          const totalDuration = input.segments.reduce((sum, seg) => sum + estimateAudioDuration(seg.text), 0);

          // Save asset record
          await db.insert(generatedAssets).values({
            taskId: input.taskId,
            projectId: input.projectId,
            assetType: "audio",
            s3Key: s3Result.key,
            s3Url: s3Result.url,
            metadata: {
              segmentCount: input.segments.length,
              duration: totalDuration,
              voices: input.segments.map((s) => s.voicePreset),
            },
          });

          // Update task
          await db
            .update(workflowTasks)
            .set({
              status: "completed",
              output: {
                audioUrl: s3Result.url,
                s3Key: s3Result.key,
                duration: totalDuration,
              },
              completedAt: new Date(),
            })
            .where(eq(workflowTasks.id, input.taskId));
        }

        return {
          success: true,
          segmentCount: input.segments.length,
          totalDuration: input.segments.reduce((sum, seg) => sum + estimateAudioDuration(seg.text), 0),
          size: combinedBuffer.length,
        };
      } catch (error) {
        console.error("[Audio] Error generating multi-segment speech:", error);
        throw new Error(
          `Failed to generate speech: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Test ElevenLabs API key
   */
  testApiKey: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const apiKey = await getApiKey(ctx.user.id, "elevenlabs");
      if (!apiKey) {
        throw new Error("No API key found");
      }

      const isValid = await validateApiKey(apiKey);

      return {
        success: isValid,
        message: isValid ? "ElevenLabs API key is valid" : "ElevenLabs API key is invalid",
      };
    } catch (error) {
      console.error("[Audio] Error testing API key:", error);
      throw new Error(`Failed to test API key: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }),
});
