import { getDb } from "../db";
import { workflowTasks, videoProjects } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getApiKey } from "../utils/apiKeyDb";
import { executeParallel, type ParallelTask } from "./parallelExecutor";
import { generateVideoScript } from "./openaiService";
import { generateImage, generateVideoFromImage } from "./piapiService";
import { textToSpeech } from "./elevenLabsService";
import { renderVideo } from "./creatomateService";
import { uploadVideo } from "./youtubeService";
import { withRetry } from "./resilience";

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

async function createWorkflowTask(
  projectId: number,
  taskType: "script" | "image" | "video" | "audio" | "render" | "upload",
  input: Record<string, any>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result: any = await db.insert(workflowTasks).values({
    projectId,
    taskType,
    status: "processing",
    input,
    retryCount: 0,
    maxRetries: 3,
    startedAt: new Date(),
  });

  return Number(result?.[0]?.insertId ?? result?.insertId ?? 0);
}

async function completeWorkflowTask(taskId: number, output: Record<string, any>) {
  const db = await getDb();
  if (!db || !taskId) return;

  await db
    .update(workflowTasks)
    .set({
      status: "completed",
      output,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(workflowTasks.id, taskId));
}

async function failWorkflowTask(taskId: number, error: unknown) {
  const db = await getDb();
  if (!db || !taskId) return;

  await db
    .update(workflowTasks)
    .set({
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(workflowTasks.id, taskId));
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
    if (!db) throw new Error("Database not available");

    console.log(`[Workflow] Starting workflow for project ${projectId}`);

    const scriptTaskId = await createWorkflowTask(projectId, "script", { step: "generate_script", topic: config.topic });
    let scriptResult: any;
    try {
      scriptResult = await withRetry(
        () =>
          generateVideoScript({
            topic: config.topic,
            sceneCount: config.sceneCount,
            videoDuration: config.duration,
          }),
        { operationName: "generateVideoScript", timeoutMs: 120000, maxAttempts: 3 }
      );
      if (!scriptResult) throw new Error("Failed to generate script");
      await completeWorkflowTask(scriptTaskId, { scenes: scriptResult.scenes?.length ?? 0 });
    } catch (error) {
      await failWorkflowTask(scriptTaskId, error);
      throw error;
    }

    const imagePrompts = scriptResult.scenes.map((s: any) => s.imagePrompt);
    const imageTasks: ParallelTask[] = imagePrompts.map((prompt: string, idx: number) => ({
      id: `image_${idx}`,
      name: `Generate Image ${idx + 1}`,
      fn: async () =>
        withRetry(
          () =>
            generateImage(String(userId), prompt, {
              model: (config.imageModel || "qwen") as "qwen" | "flux1-schnell",
            }),
          { operationName: `generateImage:${idx}`, timeoutMs: 300000, maxAttempts: 3 }
        ),
      retries: 0,
      timeout: 320000,
    }));

    const imageTaskId = await createWorkflowTask(projectId, "image", { step: "generate_images", count: imageTasks.length });
    const imageResults = await executeParallel(imageTasks, { maxConcurrency: 3 });
    const failedImages = imageResults.filter((r) => !r.success);
    if (failedImages.length > 0) {
      const error = new Error(`${failedImages.length} images failed to generate`);
      await failWorkflowTask(imageTaskId, error);
      throw error;
    }

    const imageUrls = imageResults.map((r) => r.data?.url).filter(Boolean);
    await completeWorkflowTask(imageTaskId, { generated: imageUrls.length });

    const videoTasks: ParallelTask[] = imageUrls.map((imageUrl: string, idx: number) => ({
      id: `video_${idx}`,
      name: `Generate Video ${idx + 1}`,
      fn: async () =>
        withRetry(
          () =>
            generateVideoFromImage(String(userId), imageUrl, {
              model: (config.videoModel || "veo3") as "veo3-image-to-video" | "kling-image-to-video",
              duration: Math.ceil(config.duration / config.sceneCount),
            }),
          { operationName: `generateVideo:${idx}`, timeoutMs: 600000, maxAttempts: 3 }
        ),
      retries: 0,
      timeout: 620000,
    }));

    const videoTaskId = await createWorkflowTask(projectId, "video", { step: "generate_videos", count: videoTasks.length });
    const videoResults = await executeParallel(videoTasks, { maxConcurrency: 2 });
    const failedVideos = videoResults.filter((r) => !r.success);
    if (failedVideos.length > 0) {
      const error = new Error(`${failedVideos.length} videos failed to generate`);
      await failWorkflowTask(videoTaskId, error);
      throw error;
    }

    const videoUrls = videoResults.map((r) => r.data?.url).filter(Boolean);
    await completeWorkflowTask(videoTaskId, { generated: videoUrls.length });

    const elevenLabsKey = await getApiKey(userId, "elevenlabs");
    if (!elevenLabsKey) throw new Error("ElevenLabs API key not configured");

    const audioTaskId = await createWorkflowTask(projectId, "audio", { step: "generate_audio" });
    const audioResult = await withRetry(
      () =>
        textToSpeech(elevenLabsKey, {
          text: scriptResult.voiceScript,
          voicePreset: (config.voiceId as any) || "bella",
        }),
      { operationName: "textToSpeech", timeoutMs: 180000, maxAttempts: 3 }
    );

    if (!audioResult) {
      const error = new Error("Failed to generate audio");
      await failWorkflowTask(audioTaskId, error);
      throw error;
    }

    const audioUrl = `data:audio/mp3;base64,${audioResult.toString("base64")}`;
    await completeWorkflowTask(audioTaskId, { bytes: audioResult.length });

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

    const renderTaskId = await createWorkflowTask(projectId, "render", { step: "render_video", clips: elements.videoClips.length });
    const finalVideoResult = await withRetry(
      () =>
        renderVideo(String(userId), {
          videoClips: elements.videoClips,
          audioTracks: [{ url: elements.audioUrl }],
          textOverlays: elements.textOverlays,
        }),
      { operationName: "renderVideo", timeoutMs: 900000, maxAttempts: 2 }
    );

    if (!finalVideoResult) {
      const error = new Error("Failed to render final video");
      await failWorkflowTask(renderTaskId, error);
      throw error;
    }

    const finalVideoUrl = typeof finalVideoResult === "string" ? finalVideoResult : (finalVideoResult as any).url;
    await completeWorkflowTask(renderTaskId, { url: finalVideoUrl });

    const uploadTaskId = await createWorkflowTask(projectId, "upload", { step: "upload_youtube" });
    const youtubeResult = await withRetry(
      () =>
        uploadVideo(String(userId), String(projectId), {
          title: scriptResult.title,
          description: scriptResult.description,
          tags: (scriptResult as any).tags || [],
          privacyStatus: "public",
        }),
      { operationName: "uploadVideo", timeoutMs: 600000, maxAttempts: 2 }
    );

    if (!youtubeResult) {
      const error = new Error("Failed to upload to YouTube");
      await failWorkflowTask(uploadTaskId, error);
      throw error;
    }

    const youtubeUrl =
      typeof youtubeResult === "string"
        ? youtubeResult
        : (youtubeResult as any)?.youtubeUrl || (youtubeResult as any)?.url || "";
    const videoId = typeof youtubeResult === "object" && youtubeResult !== null ? (youtubeResult as any)?.videoId : undefined;

    await completeWorkflowTask(uploadTaskId, { youtubeUrl, videoId });

    await db
      .update(videoProjects)
      .set({
        status: "completed",
        youtubeVideoId: videoId,
        youtubeUrl,
        updatedAt: new Date(),
      })
      .where(eq(videoProjects.id, projectId));

    return { success: true, videoUrl: youtubeUrl };
  } catch (error) {
    console.error("[Workflow] Error executing workflow:", error);

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
    if (!db) throw new Error("Database not available");

    const tasks = await db.select().from(workflowTasks).where(eq(workflowTasks.projectId, projectId));

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

export async function cancelWorkflow(projectId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

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
