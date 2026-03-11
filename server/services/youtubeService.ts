/**
 * YouTube Data API v3 Service
 * Handles video uploads, metadata management, and channel operations
 */

const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";

export interface VideoMetadata {
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string; // 22 = People & Blogs, 24 = Entertainment, etc.
  privacyStatus?: "public" | "unlisted" | "private";
  madeForKids?: boolean;
  license?: "creativeCommon" | "youtube";
}

export interface UploadedVideo {
  videoId: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  duration?: string;
  status: "processing" | "succeeded" | "failed";
  uploadedAt: string;
}

export interface PlaylistInfo {
  id: string;
  title: string;
  description: string;
  itemCount: number;
}

/**
 * Upload video to YouTube
 */
export async function uploadVideo(
  accessToken: string,
  videoFile: Buffer | ReadableStream<Uint8Array> | any,
  metadata: VideoMetadata
): Promise<string> {
  const body = {
    snippet: {
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags || [],
      categoryId: metadata.categoryId || "22", // Default to People & Blogs
    },
    status: {
      privacyStatus: metadata.privacyStatus || "public",
      madeForKids: metadata.madeForKids || false,
      license: metadata.license || "youtube",
    },
  };

  // Create resumable upload session
  const initResponse = await fetch(`${YOUTUBE_BASE_URL}/videos?part=snippet,status&uploadType=resumable`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": "0",
    },
    body: JSON.stringify(body),
  });

  if (!initResponse.ok) {
    const error = await initResponse.text();
    throw new Error(`YouTube error: ${initResponse.status} - ${error}`);
  }

  const uploadUrl = initResponse.headers.get("location");
  if (!uploadUrl) {
    throw new Error("No upload URL returned from YouTube");
  }

  // Upload video file
  const videoBuffer = videoFile instanceof Buffer ? videoFile : await readStreamToBuffer(videoFile as ReadableStream<Uint8Array>);

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "X-Goog-Upload-Command": "upload, finalize",
      "X-Goog-Upload-Offset": "0",
    },
    body: videoBuffer as any,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`YouTube upload error: ${uploadResponse.status} - ${error}`);
  }

  const result = (await uploadResponse.json()) as { id: string };
  return result.id;
}

/**
 * Get video information
 */
export async function getVideoInfo(accessToken: string, videoId: string): Promise<UploadedVideo> {
  const response = await fetch(
    `${YOUTUBE_BASE_URL}/videos?part=snippet,status,contentDetails&id=${videoId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as any;
  const video = data.items[0];

  if (!video) {
    throw new Error("Video not found");
  }

  return {
    videoId: video.id,
    title: video.snippet.title,
    description: video.snippet.description,
    url: `https://www.youtube.com/watch?v=${video.id}`,
    thumbnailUrl: video.snippet.thumbnails.default?.url,
    duration: video.contentDetails.duration,
    status: video.status.uploadStatus,
    uploadedAt: video.snippet.publishedAt,
  };
}

/**
 * Update video metadata
 */
export async function updateVideoMetadata(
  accessToken: string,
  videoId: string,
  metadata: Partial<VideoMetadata>
): Promise<boolean> {
  const body = {
    id: videoId,
    snippet: {
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      categoryId: metadata.categoryId,
    },
    status: {
      privacyStatus: metadata.privacyStatus,
      madeForKids: metadata.madeForKids,
    },
  };

  const response = await fetch(`${YOUTUBE_BASE_URL}/videos?part=snippet,status`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return response.ok;
}

/**
 * Delete video
 */
export async function deleteVideo(accessToken: string, videoId: string): Promise<boolean> {
  const response = await fetch(`${YOUTUBE_BASE_URL}/videos?id=${videoId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.ok;
}

/**
 * Get channel information
 */
export async function getChannelInfo(accessToken: string): Promise<any> {
  const response = await fetch(`${YOUTUBE_BASE_URL}/channels?part=snippet,statistics,contentDetails&mine=true`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as any;
  return data.items[0];
}

/**
 * Create playlist
 */
export async function createPlaylist(
  accessToken: string,
  title: string,
  description?: string
): Promise<string> {
  const body = {
    snippet: {
      title,
      description: description || "",
    },
    status: {
      privacyStatus: "public",
    },
  };

  const response = await fetch(`${YOUTUBE_BASE_URL}/playlists?part=snippet,status`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube error: ${response.status} - ${error}`);
  }

  const result = (await response.json()) as { id: string };
  return result.id;
}

/**
 * Add video to playlist
 */
export async function addVideoToPlaylist(
  accessToken: string,
  playlistId: string,
  videoId: string
): Promise<boolean> {
  const body = {
    snippet: {
      playlistId,
      resourceId: {
        kind: "youtube#video",
        videoId,
      },
    },
  };

  const response = await fetch(`${YOUTUBE_BASE_URL}/playlistItems?part=snippet`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return response.ok;
}

/**
 * Get playlist information
 */
export async function getPlaylistInfo(accessToken: string, playlistId: string): Promise<PlaylistInfo> {
  const response = await fetch(
    `${YOUTUBE_BASE_URL}/playlists?part=snippet,contentDetails&id=${playlistId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as any;
  const playlist = data.items[0];

  return {
    id: playlist.id,
    title: playlist.snippet.title,
    description: playlist.snippet.description,
    itemCount: playlist.contentDetails.itemCount,
  };
}

/**
 * List user's playlists
 */
export async function listPlaylists(accessToken: string, maxResults: number = 25): Promise<PlaylistInfo[]> {
  const response = await fetch(
    `${YOUTUBE_BASE_URL}/playlists?part=snippet,contentDetails&mine=true&maxResults=${maxResults}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as any;
  return data.items.map((p: any) => ({
    id: p.id,
    title: p.snippet.title,
    description: p.snippet.description,
    itemCount: p.contentDetails.itemCount,
  }));
}

/**
 * Helper function to read stream to buffer
 */
async function readStreamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

/**
 * Validate access token
 */
export async function validateAccessToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${YOUTUBE_BASE_URL}/channels?part=snippet&mine=true`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
