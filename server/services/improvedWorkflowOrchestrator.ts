import { getDb } from "../db";
import { workflowTasks, videoProjects } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getApiKey } from "../utils/apiKeyDb";
import {
  executeParallel,
  executeSequential,
  executeDependentTasks,
  waitForCompletion,
  type ParallelTask,
  type DependentTask,
} from "./parallelExecutor";
import { generateVideoScript, enhanceImagePrompts } from "./openaiService";
import { generateImage, generateVideoFromImage } from "./piapiService";
import { textToSpeech, getPresetVoiceId } from "./elevenLabsService";
import { renderVideo } from "./creatomateService";
import { uploadVideo } from "./youtubeService";

/**
 * Improved Workflow Orchestrator
 * Implements the exact workflow from the diagram with parallel processing
 */

export interface WorkflowConfig {
  topic: string;
  sceneCount: number;
  duration: number;
  voiceId?: string;
  imageModel?: "flux" | "qwen";
  videoModel?: "veo3" | "kling";
}

export interface WorkflowStep {
  id: string;
  name: string;
  type:
    | "generate_prompts"
    | "generate_images"
    | "wait_images"
    | "get_images"
    | "generate_videos"
    | "wait_videos"
    | "get_videos"
    | "generate_audio"
    | "upload_audio"
    | "list_elements"
    | "render_video"
    | "upload_youtube";
  status: "pending" | "processing" | "completed" | "failed";
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

/**
 * Execute complete workflow with parallel processing
 */
export async function executeCompleteWorkflow(
  projectId: number,
  userId: number,
  config: WorkflowConfig
): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    console.log(`[Workflow] Starting workflow for project ${projectId}`);

    // Step 1: Generate Prompts (OpenAI)
    console.log("[Workflow] Step 1: Generating prompts...");
    const scriptResult = await generateVideoScript({
      topic: config.topic,
      sceneCount: config.sceneCount,
      videoDuration: config.duration,
    });

    if (!scriptResult) {
      throw new Error("Failed to generate script");
    }

    // Step 2: Generate Images (Parallel)
    console.log("[Workflow] Step 2: Generating images in parallel...");
    const imagePrompts = scriptResult.scenes.map((s: any) => s.imagePrompt);
    const imageTasks: ParallelTask[] = imagePrompts.map((prompt: string, idx: number) => ({
      id: `image_${idx}`,
      name: `Generate Image ${idx + 1}`,
      fn: async () => {
        const result = await generateImage(String(userId), prompt, {
          model: (config.imageModel || "qwen") as "qwen" | "flux1-schnell",
        });
        return result;
      },
      retries: 2,
      timeout: 300000,
    }));

    const imageResults = await executeParallel(imageTasks, { maxConcurrency: 3 });
    const failedImages = imageResults.filter((r) => !r.success);
    if (failedImages.length > 0) {
      throw new Error(`${failedImages.length} images failed to generate`);
    }

    const imageUrls = imageResults.map((r) => r.data?.url).filter(Boolean);
    console.log(`[Workflow] Generated ${imageUrls.length} images`);

    // Step 3: Generate Videos (Parallel)
    console.log("[Workflow] Step 3: Generating videos from images in parallel...");
    const videoTasks: ParallelTask[] = imageUrls.map((imageUrl: string, idx: number) => ({
      id: `video_${idx}`,
      name: `Generate Video ${idx + 1}`,
      fn: async () => {
        const result = await generateVideoFromImage(String(userId), imageUrl, {
          model: (config.videoModel || "veo3") as "veo3-image-to-video" | "kling-image-to-video",
          duration: Math.ceil(config.duration / config.sceneCount),
        });
        return result;
      },
      retries: 2,
      timeout: 600000,
    }));

    const videoResults = await executeParallel(videoTasks, { maxConcurrency: 2 });
    const failedVideos = videoResults.filter((r) => !r.success);
    if (failedVideos.length > 0) {
      throw new Error(`${failedVideos.length} videos failed to generate`);
    }

    const videoUrls = videoResults.map((r) => r.data?.url).filter(Boolean);
    console.log(`[Workflow] Generated ${videoUrls.length} videos`);

    // Step 4: Generate Audio (Sequential)
    console.log("[Workflow] Step 4: Generating audio...");
    // Get API key for ElevenLabs
    const elevenLabsKey = await getApiKey(userId, "elevenlabs");
    if (!elevenLabsKey) {
      throw new Error("ElevenLabs API key not configured");
    }

    const audioResult = await textToSpeech(elevenLabsKey, {
      text: scriptResult.voiceScript,
      voicePreset: (config.voiceId as any) || "bella",
    });

    if (!audioResult) {
      throw new Error("Failed to generate audio");
    }

    // For now, assume audio is stored and we have a URL
    const audioUrl = `data:audio/mp3;base64,${audioResult.toString("base64")}`;
    console.log(`[Workflow] Generated audio`);

    // Step 5: List Elements
    console.log("[Workflow] Step 5: Listing all elements...");
    const elements = {
      videoClips: videoUrls.map((url: string, idx: number) => ({
        url,
        duration: Math.ceil(config.duration / config.sceneCount),
        index: idx,
      })),
      audioUrl,
      textOverlays: scriptResult.scenes.map((s: any, idx: number) => ({
        text: s.title,
        position: "center",
        startTime: idx * Math.ceil(config.duration / config.sceneCount),
        duration: Math.ceil(config.duration / config.sceneCount),
      })),
    };

    // Step 6: Render Final Video
    console.log("[Workflow] Step 6: Rendering final video...");
    const finalVideoResult = await renderVideo(String(userId), {
      videoClips: elements.videoClips,
      audioTracks: [{ url: elements.audioUrl }],
      textOverlays: elements.textOverlays,
    });

    if (!finalVideoResult) {
      throw new Error("Failed to render final video");
    }

    const finalVideoUrl = typeof finalVideoResult === "string" ? finalVideoResult : (finalVideoResult as any).url;
    console.log(`[Workflow] Final video rendered: ${finalVideoUrl}`);

    // Step 7: Upload to YouTube
    console.log("[Workflow] Step 7: Uploading to YouTube...");
    const youtubeResult = await uploadVideo(String(userId), String(projectId), {
      title: scriptResult.title,
      description: scriptResult.description,
      tags: (scriptResult as any).tags || [],
      privacyStatus: "public",
    });

    if (!youtubeResult) {
      throw new Error("Failed to upload to YouTube");
    }

    const youtubeUrl = typeof youtubeResult === "string" ? youtubeResult : (youtubeResult as any)?.youtubeUrl || (youtubeResult as any)?.url || "";
    const videoId = typeof youtubeResult === "object" && youtubeResult !== null ? (youtubeResult as any)?.videoId : undefined;

    console.log(`[Workflow] Video uploaded to YouTube: ${youtubeUrl}`);

    // Update project status
    await db
      .update(videoProjects)
      .set({
        status: "completed",
        youtubeVideoId: videoId,
        youtubeUrl,
        updatedAt: new Date(),
      })
      .where(eq(videoProjects.id, projectId));

    return {
      success: true,
      videoUrl: youtubeUrl,
    };
  } catch (error) {
    console.error("[Workflow] Error executing workflow:", error);

    // Update project status to failed
    const db = await getDb();
    if (db) {
      await db
        .update(videoProjects)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(videoProjects.id, projectId));
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get workflow progress
 */
export async function getWorkflowProgress(
  projectId: number
): Promise<{
  completed: number;
  total: number;
  percentage: number;
  currentStep?: string;
  estimatedTimeRemaining?: number;
}> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const tasks = await db
      .select()
      .from(workflowTasks)
      .where(eq(workflowTasks.projectId, projectId));

    const completed = tasks.filter((t) => t.status === "completed").length;
    const total = tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const currentTask = tasks.find((t) => t.status === "processing");

    return {
      completed,
      total,
      percentage,
      currentStep: currentTask?.taskType,
    };
  } catch (error) {
    console.error("[Workflow] Error getting progress:", error);
    return {
      completed: 0,
      total: 0,
      percentage: 0,
    };
  }
}

/**
 * Cancel workflow
 */
export async function cancelWorkflow(projectId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    await db
      .update(workflowTasks)
      .set({
        status: "skipped",
        updatedAt: new Date(),
      })
      .where(and(eq(workflowTasks.projectId, projectId), eq(workflowTasks.status, "pending")));

    await db
      .update(videoProjects)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(videoProjects.id, projectId));

    console.log(`[Workflow] Workflow ${projectId} cancelled/stopped`);
    return true;
  } catch (error) {
    console.error("[Workflow] Error cancelling workflow:", error);
    return false;
  }
}
