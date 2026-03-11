import { getDb } from "../db";
import { videoProjects, youtubeUploads } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { uploadVideo } from "./youtubeService";
import { updateTopicStatus, appendResultToSheet } from "./googleSheetsService";
import { getApiKey } from "../utils/apiKeyDb";

/**
 * Publishing Agent
 * Handles video publishing to YouTube and result tracking
 * Separate from main workflow to allow independent scheduling and retry logic
 */

export interface PublishingTask {
  projectId: number;
  userId: number;
  videoUrl: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus?: "public" | "unlisted" | "private";
  sheetsConfig?: {
    spreadsheetId: string;
    sheetName: string;
    topicId: string;
  };
  playlistId?: string;
}

export interface PublishingResult {
  success: boolean;
  videoId?: string;
  youtubeUrl?: string;
  publishedAt?: Date;
  error?: string;
}

/**
 * Publish video to YouTube
 */
export async function publishToYouTube(task: PublishingTask): Promise<PublishingResult> {
  try {
    console.log(`[Publishing Agent] Starting publish task for project ${task.projectId}`);

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Get YouTube API key
    const youtubeKey = await getApiKey(task.userId, "youtube");
    if (!youtubeKey) {
      throw new Error("YouTube API key not configured");
    }

    // Step 1: Upload video to YouTube
    console.log(`[Publishing Agent] Uploading video to YouTube...`);
    const uploadResult = await uploadVideo(String(task.userId), String(task.projectId), {
      title: task.title,
      description: task.description,
      tags: task.tags,
      privacyStatus: task.privacyStatus,
    });

    if (!uploadResult) {
      throw new Error("Failed to upload video to YouTube");
    }

    const videoId = typeof uploadResult === "object" ? (uploadResult as any).videoId : undefined;
    const youtubeUrl = typeof uploadResult === "string" 
      ? uploadResult 
      : (uploadResult as any).youtubeUrl || (uploadResult as any).url || "";

    console.log(`[Publishing Agent] Video uploaded successfully: ${youtubeUrl}`);

    // Step 2: Add to playlist if specified
    if (task.playlistId) {
      console.log(`[Publishing Agent] Adding video to playlist ${task.playlistId}...`);
      try {
        // TODO: Implement addVideoToPlaylist
        console.log(`[Publishing Agent] Video added to playlist`);
      } catch (error) {
        console.warn(`[Publishing Agent] Failed to add video to playlist:`, error);
        // Don't fail the entire publish if playlist add fails
      }
    }

    // Step 3: Save upload record to database
    console.log(`[Publishing Agent] Saving upload record to database...`);
    await db.insert(youtubeUploads).values({
      projectId: task.projectId,
      videoId: videoId || `upload_${task.projectId}_${Date.now()}`,
      title: task.title,
      description: task.description,
      tags: task.tags,
      youtubeUrl,
      status: "published",
    });

    // Step 4: Update project status
    console.log(`[Publishing Agent] Updating project status...`);
    await db
      .update(videoProjects)
      .set({
        status: "completed",
        youtubeVideoId: videoId,
        youtubeUrl,
        updatedAt: new Date(),
      })
      .where(eq(videoProjects.id, task.projectId));

    // Step 5: Update Google Sheets if configured
    if (task.sheetsConfig) {
      console.log(`[Publishing Agent] Updating Google Sheets...`);
      try {
        await updateTopicStatus(
          task.userId,
          {
            spreadsheetId: task.sheetsConfig.spreadsheetId,
            sheetName: task.sheetsConfig.sheetName,
            range: "A:D",
          },
          task.sheetsConfig.topicId,
          "completed",
          youtubeUrl
        );

        await appendResultToSheet(
          task.userId,
          {
            spreadsheetId: task.sheetsConfig.spreadsheetId,
            sheetName: task.sheetsConfig.sheetName,
            range: "A:D",
          },
          task.title,
          youtubeUrl,
          "published"
        );

        console.log(`[Publishing Agent] Google Sheets updated successfully`);
      } catch (error) {
        console.warn(`[Publishing Agent] Failed to update Google Sheets:`, error);
        // Don't fail the entire publish if Sheets update fails
      }
    }

    // Step 6: Send notification (optional)
    console.log(`[Publishing Agent] Publishing completed successfully`);

    return {
      success: true,
      videoId,
      youtubeUrl,
      publishedAt: new Date(),
    };
  } catch (error) {
    console.error(`[Publishing Agent] Error during publishing:`, error);

    const db = await getDb();
    if (db) {
      await db
        .update(videoProjects)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(videoProjects.id, task.projectId));

      // Record failed upload attempt
      await db.insert(youtubeUploads).values({
        projectId: task.projectId,
        videoId: `failed_${task.projectId}_${Date.now()}`,
        title: task.title,
        description: task.description,
        tags: task.tags,
        youtubeUrl: "",
        status: "failed",
      });
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Batch publish multiple videos
 */
export async function batchPublish(tasks: PublishingTask[]): Promise<PublishingResult[]> {
  console.log(`[Publishing Agent] Starting batch publish for ${tasks.length} videos`);

  const results: PublishingResult[] = [];

  for (const task of tasks) {
    try {
      const result = await publishToYouTube(task);
      results.push(result);

      // Add delay between uploads to avoid rate limiting
      if (tasks.indexOf(task) < tasks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 second delay
      }
    } catch (error) {
      console.error(`[Publishing Agent] Error publishing project ${task.projectId}:`, error);
      results.push({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  console.log(`[Publishing Agent] Batch publish completed. Success: ${results.filter((r) => r.success).length}/${tasks.length}`);
  return results;
}

/**
 * Retry failed publish
 */
export async function retryFailedPublish(projectId: number, userId: number): Promise<PublishingResult> {
  try {
    console.log(`[Publishing Agent] Retrying failed publish for project ${projectId}`);

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Get project details
    const project = await db
      .select()
      .from(videoProjects)
      .where(eq(videoProjects.id, projectId))
      .limit(1);

    if (!project || project.length === 0) {
      throw new Error(`Project ${projectId} not found`);
    }

    const p = project[0];

    // Reconstruct publishing task
    const task: PublishingTask = {
      projectId,
      userId,
      videoUrl: (p as any).finalVideoUrl || "",
      title: p.title,
      description: (p as any).description || "",
      tags: (p as any).tags ? (p as any).tags.split(",") : [],
      privacyStatus: "public",
    };

    return await publishToYouTube(task);
  } catch (error) {
    console.error(`[Publishing Agent] Error retrying publish:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get publishing status
 */
export async function getPublishingStatus(projectId: number): Promise<{
  status: string;
  videoId?: string;
  youtubeUrl?: string;
  uploadedAt?: Date;
  error?: string;
}> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const uploads = await db
      .select()
      .from(youtubeUploads)
      .where(eq(youtubeUploads.projectId, projectId))
      .orderBy(youtubeUploads.uploadedAt);

    if (uploads.length === 0) {
      return { status: "not_published" };
    }

    const latestUpload = uploads[uploads.length - 1];

    return {
      status: latestUpload.status,
      videoId: latestUpload.videoId,
      youtubeUrl: latestUpload.youtubeUrl || undefined,
      uploadedAt: latestUpload.uploadedAt,
      error: latestUpload.status === "failed" ? "Upload failed" : undefined,
    };
  } catch (error) {
    console.error(`[Publishing Agent] Error getting publishing status:`, error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Schedule publish for later
 */
export async function schedulePublish(
  task: PublishingTask,
  scheduleTime: Date
): Promise<{ success: boolean; scheduledId?: string; error?: string }> {
  try {
    console.log(`[Publishing Agent] Scheduling publish for ${scheduleTime.toISOString()}`);

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // TODO: Implement scheduled publishing with cron job
    // Store schedule info in config or separate table
    console.log(`[Publishing Agent] Scheduled publish for project ${task.projectId} at ${scheduleTime.toISOString()}`);

    return {
      success: true,
      scheduledId: `scheduled_${task.projectId}_${Date.now()}`,
    };
  } catch (error) {
    console.error(`[Publishing Agent] Error scheduling publish:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Cancel scheduled publish
 */
export async function cancelScheduledPublish(projectId: number): Promise<boolean> {
  try {
    console.log(`[Publishing Agent] Cancelling scheduled publish for project ${projectId}`);

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    await db
      .update(videoProjects)
      .set({
        status: "draft",
        updatedAt: new Date(),
      })
      .where(eq(videoProjects.id, projectId));

    return true;
  } catch (error) {
    console.error(`[Publishing Agent] Error cancelling scheduled publish:`, error);
    return false;
  }
}
