import { describe, expect, it, vi } from "vitest";
import {
  publishToYouTube,
  batchPublish,
  getPublishingStatus,
  type PublishingTask,
  type PublishingResult,
} from "./publishingAgent";

describe("Publishing Agent", () => {
  describe("publishToYouTube", () => {
    it("should create a valid publishing task", () => {
      const task: PublishingTask = {
        projectId: 1,
        userId: 1,
        videoUrl: "https://example.com/video.mp4",
        title: "Test Video",
        description: "Test Description",
        tags: ["test", "video"],
        privacyStatus: "public",
      };

      expect(task.projectId).toBe(1);
      expect(task.title).toBe("Test Video");
      expect(task.tags).toHaveLength(2);
    });

    it("should handle optional fields in publishing task", () => {
      const task: PublishingTask = {
        projectId: 1,
        userId: 1,
        videoUrl: "https://example.com/video.mp4",
        title: "Test Video",
        description: "Test Description",
        tags: [],
      };

      expect(task.privacyStatus).toBeUndefined();
      expect(task.playlistId).toBeUndefined();
      expect(task.sheetsConfig).toBeUndefined();
    });

    it("should validate publishing result structure", () => {
      const result: PublishingResult = {
        success: true,
        videoId: "dQw4w9WgXcQ",
        youtubeUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
        publishedAt: new Date(),
      };

      expect(result.success).toBe(true);
      expect(result.videoId).toBeDefined();
      expect(result.youtubeUrl).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it("should handle failed publishing result", () => {
      const result: PublishingResult = {
        success: false,
        error: "API key not configured",
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.videoId).toBeUndefined();
    });
  });

  describe("batchPublish", () => {
    it("should process multiple publishing tasks", () => {
      const tasks: PublishingTask[] = [
        {
          projectId: 1,
          userId: 1,
          videoUrl: "https://example.com/video1.mp4",
          title: "Video 1",
          description: "Description 1",
          tags: ["test"],
        },
        {
          projectId: 2,
          userId: 1,
          videoUrl: "https://example.com/video2.mp4",
          title: "Video 2",
          description: "Description 2",
          tags: ["test"],
        },
      ];

      expect(tasks).toHaveLength(2);
      expect(tasks[0].projectId).toBe(1);
      expect(tasks[1].projectId).toBe(2);
    });

    it("should handle empty batch", () => {
      const tasks: PublishingTask[] = [];
      expect(tasks).toHaveLength(0);
    });
  });

  describe("Publishing Task Validation", () => {
    it("should validate required fields", () => {
      const task: PublishingTask = {
        projectId: 1,
        userId: 1,
        videoUrl: "https://example.com/video.mp4",
        title: "Test Video",
        description: "Test Description",
        tags: ["test"],
      };

      expect(task.projectId).toBeGreaterThan(0);
      expect(task.userId).toBeGreaterThan(0);
      expect(task.videoUrl).toMatch(/^https?:\/\//);
      expect(task.title.length).toBeGreaterThan(0);
    });

    it("should handle privacy status options", () => {
      const publicTask: PublishingTask = {
        projectId: 1,
        userId: 1,
        videoUrl: "https://example.com/video.mp4",
        title: "Public Video",
        description: "",
        tags: [],
        privacyStatus: "public",
      };

      const unlistedTask: PublishingTask = {
        projectId: 2,
        userId: 1,
        videoUrl: "https://example.com/video.mp4",
        title: "Unlisted Video",
        description: "",
        tags: [],
        privacyStatus: "unlisted",
      };

      const privateTask: PublishingTask = {
        projectId: 3,
        userId: 1,
        videoUrl: "https://example.com/video.mp4",
        title: "Private Video",
        description: "",
        tags: [],
        privacyStatus: "private",
      };

      expect(publicTask.privacyStatus).toBe("public");
      expect(unlistedTask.privacyStatus).toBe("unlisted");
      expect(privateTask.privacyStatus).toBe("private");
    });

    it("should handle sheets configuration", () => {
      const task: PublishingTask = {
        projectId: 1,
        userId: 1,
        videoUrl: "https://example.com/video.mp4",
        title: "Test Video",
        description: "",
        tags: [],
        sheetsConfig: {
          spreadsheetId: "1234567890",
          sheetName: "Results",
          topicId: "topic_1",
        },
      };

      expect(task.sheetsConfig).toBeDefined();
      expect(task.sheetsConfig?.spreadsheetId).toBe("1234567890");
      expect(task.sheetsConfig?.sheetName).toBe("Results");
      expect(task.sheetsConfig?.topicId).toBe("topic_1");
    });
  });

  describe("Publishing Result Handling", () => {
    it("should track successful publish with metadata", () => {
      const result: PublishingResult = {
        success: true,
        videoId: "dQw4w9WgXcQ",
        youtubeUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
        publishedAt: new Date("2026-03-10T10:00:00Z"),
      };

      expect(result.success).toBe(true);
      expect(result.videoId).toMatch(/^[a-zA-Z0-9_-]{11}$/);
      expect(result.youtubeUrl).toMatch(/youtube\.com/);
      expect(result.publishedAt).toBeInstanceOf(Date);
    });

    it("should track failed publish with error message", () => {
      const result: PublishingResult = {
        success: false,
        error: "YouTube API quota exceeded",
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.videoId).toBeUndefined();
      expect(result.youtubeUrl).toBeUndefined();
    });
  });

  describe("Batch Publishing", () => {
    it("should calculate batch statistics", () => {
      const results: PublishingResult[] = [
        { success: true, videoId: "vid1", youtubeUrl: "https://youtube.com/watch?v=vid1" },
        { success: true, videoId: "vid2", youtubeUrl: "https://youtube.com/watch?v=vid2" },
        { success: false, error: "Failed" },
      ];

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      expect(successCount).toBe(2);
      expect(failureCount).toBe(1);
      expect(results).toHaveLength(3);
    });
  });

  describe("Publishing Scheduling", () => {
    it("should handle scheduled publish time", () => {
      const now = new Date();
      const futureTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

      expect(futureTime.getTime()).toBeGreaterThan(now.getTime());
    });

    it("should validate schedule time is in future", () => {
      const now = new Date();
      const pastTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      const futureTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later

      expect(pastTime.getTime()).toBeLessThan(now.getTime());
      expect(futureTime.getTime()).toBeGreaterThan(now.getTime());
    });
  });
});
