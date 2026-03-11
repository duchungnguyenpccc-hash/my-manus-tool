/**
 * PiAPI Service - Unified AI model API for image and video generation
 * Handles text-to-image (Qwen/Flux) and image-to-video (Veo3/Kling) tasks
 */

const PIAPI_BASE_URL = "https://api.piapi.ai/api/v1";
const PIAPI_TASK_ENDPOINT = `${PIAPI_BASE_URL}/task`;
const POLL_INTERVAL = 5000; // 5 seconds
const MAX_POLLS = 120; // 10 minutes max

export type ImageModel = "qwen" | "flux1-schnell";
export type VideoModel = "veo3-image-to-video" | "kling-image-to-video";

export interface TextToImageInput {
  prompt: string;
  model?: ImageModel;
  width?: number;
  height?: number;
  negativePrompt?: string;
}

export interface ImageToVideoInput {
  imageUrl: string;
  prompt?: string;
  model?: VideoModel;
  duration?: number; // in seconds
}

export interface TaskResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: {
    images?: string[];
    video?: string;
    url?: string;
  };
  error?: string;
}

/**
 * Create a text-to-image task
 */
export async function createTextToImageTask(
  apiKey: string,
  input: TextToImageInput
): Promise<string> {
  const model = input.model || "qwen";
  const modelMap: Record<ImageModel, string> = {
    qwen: "Qubico/qwen-vl-plus",
    "flux1-schnell": "Qubico/flux1-schnell",
  };

  const payload = {
    model: modelMap[model],
    task_type: "txt2img",
    input: {
      prompt: input.prompt,
      negative_prompt: input.negativePrompt || "",
      width: input.width || 1024,
      height: input.height || 1024,
    },
  };

  const response = await fetch(PIAPI_TASK_ENDPOINT, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PiAPI error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}

/**
 * Create an image-to-video task
 */
export async function createImageToVideoTask(
  apiKey: string,
  input: ImageToVideoInput
): Promise<string> {
  const model = input.model || "veo3-image-to-video";
  const modelMap: Record<VideoModel, string> = {
    "veo3-image-to-video": "Veo3/image-to-video",
    "kling-image-to-video": "Kling/image-to-video",
  };

  const payload = {
    model: modelMap[model],
    task_type: "img2video",
    input: {
      image_url: input.imageUrl,
      prompt: input.prompt || "A smooth, cinematic video transition",
      duration: input.duration || 5,
    },
  };

  const response = await fetch(PIAPI_TASK_ENDPOINT, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PiAPI error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}

/**
 * Get task status
 */
export async function getTaskStatus(apiKey: string, taskId: string): Promise<TaskResponse> {
  const response = await fetch(`${PIAPI_TASK_ENDPOINT}/${taskId}`, {
    headers: {
      "X-API-Key": apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PiAPI error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as TaskResponse;
  return data;
}

/**
 * Poll task until completion
 */
export async function pollTaskCompletion(
  apiKey: string,
  taskId: string,
  onProgress?: (status: string, progress: number) => void
): Promise<TaskResponse> {
  let pollCount = 0;

  while (pollCount < MAX_POLLS) {
    const task = await getTaskStatus(apiKey, taskId);

    if (onProgress) {
      const progress = Math.min(100, (pollCount / MAX_POLLS) * 100);
      onProgress(task.status, progress);
    }

    if (task.status === "completed") {
      return task;
    }

    if (task.status === "failed") {
      throw new Error(`Task failed: ${task.error || "Unknown error"}`);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    pollCount++;
  }

  throw new Error("Task polling timeout");
}

/**
 * Generate image from text prompt
 */
export async function generateImage(
  apiKey: string,
  prompt: string,
  options?: {
    model?: ImageModel;
    width?: number;
    height?: number;
    onProgress?: (status: string, progress: number) => void;
  }
): Promise<string> {
  const taskId = await createTextToImageTask(apiKey, {
    prompt,
    model: options?.model,
    width: options?.width,
    height: options?.height,
  });

  const result = await pollTaskCompletion(apiKey, taskId, options?.onProgress);

  if (!result.result?.images || result.result.images.length === 0) {
    throw new Error("No images generated");
  }

  return result.result.images[0];
}

/**
 * Generate video from image
 */
export async function generateVideoFromImage(
  apiKey: string,
  imageUrl: string,
  options?: {
    prompt?: string;
    model?: VideoModel;
    duration?: number;
    onProgress?: (status: string, progress: number) => void;
  }
): Promise<string> {
  const taskId = await createImageToVideoTask(apiKey, {
    imageUrl,
    prompt: options?.prompt,
    model: options?.model,
    duration: options?.duration,
  });

  const result = await pollTaskCompletion(apiKey, taskId, options?.onProgress);

  if (!result.result?.video && !result.result?.url) {
    throw new Error("No video generated");
  }

  return result.result.video || result.result.url || "";
}

/**
 * Batch generate images from multiple prompts
 */
export async function generateImageBatch(
  apiKey: string,
  prompts: string[],
  options?: {
    model?: ImageModel;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < prompts.length; i++) {
    const imageUrl = await generateImage(apiKey, prompts[i], {
      model: options?.model,
    });
    results.push(imageUrl);

    if (options?.onProgress) {
      options.onProgress(i + 1, prompts.length);
    }
  }

  return results;
}

/**
 * Batch generate videos from multiple images
 */
export async function generateVideoBatch(
  apiKey: string,
  imageUrls: string[],
  options?: {
    model?: VideoModel;
    duration?: number;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const videoUrl = await generateVideoFromImage(apiKey, imageUrls[i], {
      model: options?.model,
      duration: options?.duration,
    });
    results.push(videoUrl);

    if (options?.onProgress) {
      options.onProgress(i + 1, imageUrls.length);
    }
  }

  return results;
}
