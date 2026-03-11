/**
 * Creatomate Video Rendering Service
 * Handles video composition, rendering, and output management
 */

const CREATOMATE_BASE_URL = "https://api.creatomate.com";

export interface VideoClip {
  url: string;
  duration?: number;
  startTime?: number;
}

export interface AudioTrack {
  url: string;
  startTime?: number;
}

export interface TextOverlay {
  text: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  startTime?: number;
  duration?: number;
  x?: number;
  y?: number;
}

export interface RenderScriptElement {
  type: "video" | "audio" | "text" | "image";
  [key: string]: any;
}

export interface RenderJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress?: number;
  output?: {
    url?: string;
    duration?: number;
  };
  error?: string;
}

/**
 * Build a Creatomate RenderScript for video composition
 */
export function buildRenderScript(options: {
  width?: number;
  height?: number;
  duration?: number;
  videoClips: VideoClip[];
  audioTracks?: AudioTrack[];
  textOverlays?: TextOverlay[];
  backgroundColor?: string;
}): any {
  const {
    width = 1920,
    height = 1080,
    duration = 60,
    videoClips,
    audioTracks = [],
    textOverlays = [],
    backgroundColor = "#000000",
  } = options;

  const elements: RenderScriptElement[] = [];

  // Add video clips
  videoClips.forEach((clip, index) => {
    elements.push({
      type: "video",
      source: clip.url,
      duration: clip.duration || 5,
      startTime: clip.startTime || index * (clip.duration || 5),
      width: "100%",
      height: "100%",
      fit: "cover",
    });
  });

  // Add audio tracks
  audioTracks.forEach((audio) => {
    elements.push({
      type: "audio",
      source: audio.url,
      startTime: audio.startTime || 0,
      volume: 1,
    });
  });

  // Add text overlays
  textOverlays.forEach((text) => {
    elements.push({
      type: "text",
      text: text.text,
      fontSize: text.fontSize || 48,
      color: text.color || "#FFFFFF",
      fontFamily: text.fontFamily || "Arial",
      startTime: text.startTime || 0,
      duration: text.duration || 5,
      x: text.x || "center",
      y: text.y || "center",
      width: "80%",
      textAlign: "center",
    });
  });

  return {
    canvas: {
      width,
      height,
      duration,
      backgroundColor,
    },
    elements,
  };
}

/**
 * Submit a render job to Creatomate
 */
export async function submitRenderJob(
  apiKey: string,
  renderScript: any,
  outputFormat: "mp4" | "webm" | "gif" = "mp4"
): Promise<string> {
  const payload = {
    source: renderScript,
    output: {
      format: outputFormat,
      quality: "high",
    },
  };

  const response = await fetch(`${CREATOMATE_BASE_URL}/render`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Creatomate error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}

/**
 * Get render job status
 */
export async function getRenderJobStatus(apiKey: string, jobId: string): Promise<RenderJob> {
  const response = await fetch(`${CREATOMATE_BASE_URL}/render/${jobId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Creatomate error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as RenderJob;
  return data;
}

/**
 * Poll render job until completion
 */
export async function pollRenderJob(
  apiKey: string,
  jobId: string,
  maxWaitTime: number = 3600000, // 1 hour default
  onProgress?: (status: string, progress: number) => void
): Promise<RenderJob> {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  while (Date.now() - startTime < maxWaitTime) {
    const job = await getRenderJobStatus(apiKey, jobId);

    if (onProgress) {
      onProgress(job.status, job.progress || 0);
    }

    if (job.status === "completed") {
      return job;
    }

    if (job.status === "failed") {
      throw new Error(`Render job failed: ${job.error || "Unknown error"}`);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Render job polling timeout");
}

/**
 * Create and render video in one call
 */
export async function renderVideo(
  apiKey: string,
  options: {
    width?: number;
    height?: number;
    duration?: number;
    videoClips: VideoClip[];
    audioTracks?: AudioTrack[];
    textOverlays?: TextOverlay[];
    backgroundColor?: string;
    outputFormat?: "mp4" | "webm" | "gif";
    onProgress?: (status: string, progress: number) => void;
  }
): Promise<string> {
  // Build render script
  const renderScript = buildRenderScript({
    width: options.width,
    height: options.height,
    duration: options.duration,
    videoClips: options.videoClips,
    audioTracks: options.audioTracks,
    textOverlays: options.textOverlays,
    backgroundColor: options.backgroundColor,
  });

  // Submit render job
  const jobId = await submitRenderJob(apiKey, renderScript, options.outputFormat || "mp4");

  // Poll until completion
  const job = await pollRenderJob(apiKey, jobId, 3600000, options.onProgress);

  if (!job.output?.url) {
    throw new Error("No output URL returned from render job");
  }

  return job.output.url;
}

/**
 * Validate API key
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${CREATOMATE_BASE_URL}/account`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get account info
 */
export async function getAccountInfo(apiKey: string): Promise<any> {
  const response = await fetch(`${CREATOMATE_BASE_URL}/account`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Creatomate error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Cancel a render job
 */
export async function cancelRenderJob(apiKey: string, jobId: string): Promise<boolean> {
  const response = await fetch(`${CREATOMATE_BASE_URL}/render/${jobId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  return response.ok;
}
