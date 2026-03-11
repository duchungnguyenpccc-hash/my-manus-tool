import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  uploadVideo,
  getVideoInfo,
  updateVideoMetadata,
  deleteVideo,
  getChannelInfo,
  createPlaylist,
  addVideoToPlaylist,
  listPlaylists,
  getPlaylistInfo,
  validateAccessToken,
} from "../services/youtubeService";
import { getDb } from "../db";
import { youtubeUploads, videoProjects, apiKeys } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const youtubeRouter = router({
  /**
   * Upload video to YouTube
   */
  uploadVideo: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int(),
        videoUrl: z.string().url(),
        title: z.string().min(1).max(100),
        description: z.string().max(5000),
        tags: z.array(z.string()).optional(),
        categoryId: z.string().optional(),
        privacyStatus: z.enum(["public", "unlisted", "private"]).default("public"),
        madeForKids: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
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

        // Get user's YouTube access token from apiKeys table
        const apiKeyRecord = await db
          .select()
          .from(apiKeys)
          .where(eq(apiKeys.userId, ctx.user.id) && eq(apiKeys.provider, "youtube"))
          .limit(1);

        if (apiKeyRecord.length === 0) {
          throw new Error("YouTube API key not found. Please add it in settings.");
        }

        const youtubeToken = apiKeyRecord[0].encryptedKey; // This needs to be decrypted
        if (!youtubeToken) {
          throw new Error("YouTube access token not found. Please connect your YouTube account.");
        }

        // Download video from URL
        const videoResponse = await fetch(input.videoUrl);
        if (!videoResponse.ok) {
          throw new Error("Failed to download video");
        }
        const videoBuffer = await videoResponse.arrayBuffer();

        // Upload to YouTube
        const videoId = await uploadVideo(youtubeToken, Buffer.from(videoBuffer), {
          title: input.title,
          description: input.description,
          tags: input.tags,
          categoryId: input.categoryId,
          privacyStatus: input.privacyStatus,
          madeForKids: input.madeForKids,
        });

        // Get video info
        const videoInfo = await getVideoInfo(youtubeToken, videoId);

        // Save upload record to database
        await db.insert(youtubeUploads).values({
          projectId: input.projectId,
          videoId,
          title: input.title,
          description: input.description,
          youtubeUrl: videoInfo.url,
          thumbnail: videoInfo.thumbnailUrl,
          status: "processing",
          uploadedAt: new Date(),
        });

        // Update project with YouTube URL
        await db
          .update(videoProjects)
          .set({
            youtubeUrl: videoInfo.url,
            status: "completed",
            updatedAt: new Date(),
          })
          .where(eq(videoProjects.id, input.projectId));

        return {
          success: true,
          videoId,
          youtubeUrl: videoInfo.url,
          thumbnailUrl: videoInfo.thumbnailUrl,
        };
      } catch (error) {
        console.error("[YouTube] Error uploading video:", error);
        throw new Error(`Failed to upload video: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Get video information
   */
  getVideoInfo: protectedProcedure
    .input(
      z.object({
        videoId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get upload record
        const upload = await db
          .select()
          .from(youtubeUploads)
          .where(eq(youtubeUploads.videoId, input.videoId))
          .limit(1);

        if (upload.length === 0) {
          throw new Error("Video not found or unauthorized");
        }

        // Get project to verify ownership
        const project = await db
          .select()
          .from(videoProjects)
          .where(eq(videoProjects.id, upload[0].projectId))
          .limit(1);

        if (project.length === 0 || project[0].userId !== ctx.user.id) {
          throw new Error("Project not found or unauthorized");
        }

        // Get YouTube API key
        const apiKeyRecord = await db
          .select()
          .from(apiKeys)
          .where(eq(apiKeys.userId, ctx.user.id) && eq(apiKeys.provider, "youtube"))
          .limit(1);

        if (apiKeyRecord.length === 0) {
          throw new Error("YouTube API key not found");
        }

        const youtubeToken = apiKeyRecord[0].encryptedKey; // This needs to be decrypted
        const videoInfo = await getVideoInfo(youtubeToken, input.videoId);

        return {
          success: true,
          video: videoInfo,
        };
      } catch (error) {
        console.error("[YouTube] Error getting video info:", error);
        throw new Error(`Failed to get video info: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Update video metadata
   */
  updateMetadata: protectedProcedure
    .input(
      z.object({
        videoId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        privacyStatus: z.enum(["public", "unlisted", "private"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get upload record
        const upload = await db
          .select()
          .from(youtubeUploads)
          .where(eq(youtubeUploads.videoId, input.videoId))
          .limit(1);

        if (upload.length === 0) {
          throw new Error("Video not found or unauthorized");
        }

        // Get project to verify ownership
        const project = await db
          .select()
          .from(videoProjects)
          .where(eq(videoProjects.id, upload[0].projectId))
          .limit(1);

        if (project.length === 0 || project[0].userId !== ctx.user.id) {
          throw new Error("Project not found or unauthorized");
        }

        // Get YouTube API key
        const apiKeyRecord = await db
          .select()
          .from(apiKeys)
          .where(and(eq(apiKeys.userId, ctx.user.id), eq(apiKeys.provider, "youtube")))
          .limit(1);

        if (apiKeyRecord.length === 0) {
          throw new Error("YouTube API key not found");
        }

        const youtubeToken = apiKeyRecord[0].encryptedKey; // This needs to be decrypted
        const success = await updateVideoMetadata(youtubeToken, input.videoId, {
          title: input.title,
          description: input.description,
          tags: input.tags,
          privacyStatus: input.privacyStatus,
        });

        return {
          success,
          message: success ? "Video metadata updated successfully" : "Failed to update video metadata",
        };
      } catch (error) {
        console.error("[YouTube] Error updating metadata:", error);
        throw new Error(`Failed to update metadata: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Delete video
   */
  deleteVideo: protectedProcedure
    .input(
      z.object({
        videoId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get upload record
        const upload = await db
          .select()
          .from(youtubeUploads)
          .where(eq(youtubeUploads.videoId, input.videoId))
          .limit(1);

        if (upload.length === 0) {
          throw new Error("Video not found or unauthorized");
        }

        // Get project to verify ownership
        const project = await db
          .select()
          .from(videoProjects)
          .where(eq(videoProjects.id, upload[0].projectId))
          .limit(1);

        if (project.length === 0 || project[0].userId !== ctx.user.id) {
          throw new Error("Project not found or unauthorized");
        }

        // Get YouTube API key
        const apiKeyRecord = await db
          .select()
          .from(apiKeys)
          .where(and(eq(apiKeys.userId, ctx.user.id), eq(apiKeys.provider, "youtube")))
          .limit(1);

        if (apiKeyRecord.length === 0) {
          throw new Error("YouTube API key not found");
        }

        const youtubeToken = apiKeyRecord[0].encryptedKey; // This needs to be decrypted
        const success = await deleteVideo(youtubeToken, input.videoId);

        if (success) {
          // Delete from database
          await db.delete(youtubeUploads).where(eq(youtubeUploads.videoId, input.videoId));
        }

        return {
          success,
          message: success ? "Video deleted successfully" : "Failed to delete video",
        };
      } catch (error) {
        console.error("[YouTube] Error deleting video:", error);
        throw new Error(`Failed to delete video: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Get channel information
   */
  getChannelInfo: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get user's YouTube API key
      const apiKeyRecord = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, ctx.user.id), eq(apiKeys.provider, "youtube")))
        .limit(1);

      if (apiKeyRecord.length === 0) {
        throw new Error("YouTube API key not found. Please add it in settings.");
      }

        const youtubeToken = apiKeyRecord[0].encryptedKey; // This needs to be decrypted
        // Note: youtubeToken is encrypted and needs to be decrypted before use
        // For now, we'll use it directly - implement decryption in production
        const channelInfo = await getChannelInfo(youtubeToken);

      return {
        success: true,
        channel: {
          id: channelInfo.id,
          title: channelInfo.snippet.title,
          description: channelInfo.snippet.description,
          thumbnailUrl: channelInfo.snippet.thumbnails.default?.url,
          subscriberCount: channelInfo.statistics.subscriberCount,
          videoCount: channelInfo.statistics.videoCount,
          viewCount: channelInfo.statistics.viewCount,
        },
      };
    } catch (error) {
      console.error("[YouTube] Error getting channel info:", error);
      throw new Error(`Failed to get channel info: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }),

  /**
   * List user's playlists
   */
  listPlaylists: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get user's YouTube API key
      const apiKeyRecord = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, ctx.user.id), eq(apiKeys.provider, "youtube")))
        .limit(1);

      if (apiKeyRecord.length === 0) {
        throw new Error("YouTube API key not found. Please add it in settings.");
      }

      const youtubeToken = apiKeyRecord[0].encryptedKey; // This needs to be decrypted
      // Note: youtubeToken is encrypted and needs to be decrypted before use
      // For now, we'll use it directly - implement decryption in production
      const playlists = await listPlaylists(youtubeToken);

      return {
        success: true,
        playlists,
      };
    } catch (error) {
      console.error("[YouTube] Error listing playlists:", error);
      throw new Error(`Failed to list playlists: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }),

  /**
   * Create playlist
   */
  createPlaylist: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get user's YouTube API key
        const apiKeyRecord = await db
          .select()
          .from(apiKeys)
          .where(and(eq(apiKeys.userId, ctx.user.id), eq(apiKeys.provider, "youtube")))
          .limit(1);

        if (apiKeyRecord.length === 0) {
          throw new Error("YouTube API key not found. Please add it in settings.");
        }

        const youtubeToken = apiKeyRecord[0].encryptedKey; // This needs to be decrypted
        // Note: youtubeToken is encrypted and needs to be decrypted before use
        // For now, we'll use it directly - implement decryption in production
        const playlistId = await createPlaylist(youtubeToken, input.title, input.description);

        return {
          success: true,
          playlistId,
        };
      } catch (error) {
        console.error("[YouTube] Error creating playlist:", error);
        throw new Error(`Failed to create playlist: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Add video to playlist
   */
  addToPlaylist: protectedProcedure
    .input(
      z.object({
        videoId: z.string(),
        playlistId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get upload record
        const upload = await db
          .select()
          .from(youtubeUploads)
          .where(eq(youtubeUploads.videoId, input.videoId))
          .limit(1);

        if (upload.length === 0) {
          throw new Error("Video not found or unauthorized");
        }

        // Get project to verify ownership
        const project = await db
          .select()
          .from(videoProjects)
          .where(eq(videoProjects.id, upload[0].projectId))
          .limit(1);

        if (project.length === 0 || project[0].userId !== ctx.user.id) {
          throw new Error("Project not found or unauthorized");
        }

        // Get YouTube API key
        const apiKeyRecord = await db
          .select()
          .from(apiKeys)
          .where(and(eq(apiKeys.userId, ctx.user.id), eq(apiKeys.provider, "youtube")))
          .limit(1);

        if (apiKeyRecord.length === 0) {
          throw new Error("YouTube API key not found");
        }

        const youtubeToken = apiKeyRecord[0].encryptedKey; // This needs to be decrypted
        const success = await addVideoToPlaylist(
          youtubeToken,
          input.playlistId,
          input.videoId
        );

        return {
          success,
          message: success ? "Video added to playlist successfully" : "Failed to add video to playlist",
        };
      } catch (error) {
        console.error("[YouTube] Error adding to playlist:", error);
        throw new Error(`Failed to add to playlist: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),
});
