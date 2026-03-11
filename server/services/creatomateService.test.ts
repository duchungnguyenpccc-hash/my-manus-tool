import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildRenderScript, submitRenderJob, getRenderJobStatus, validateApiKey } from "./creatomateService";

// Mock fetch
global.fetch = vi.fn();

describe("Creatomate Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildRenderScript", () => {
    it("should build render script with video clips", () => {
      const script = buildRenderScript({
        videoClips: [
          { url: "https://example.com/video1.mp4", duration: 5 },
          { url: "https://example.com/video2.mp4", duration: 5 },
        ],
      });

      expect(script.canvas).toBeDefined();
      expect(script.canvas.width).toBe(1920);
      expect(script.canvas.height).toBe(1080);
      expect(script.elements).toHaveLength(2);
      expect(script.elements[0].type).toBe("video");
    });

    it("should include audio tracks in render script", () => {
      const script = buildRenderScript({
        videoClips: [{ url: "https://example.com/video.mp4" }],
        audioTracks: [{ url: "https://example.com/audio.mp3", startTime: 0 }],
      });

      expect(script.elements).toHaveLength(2);
      expect(script.elements[1].type).toBe("audio");
    });

    it("should include text overlays in render script", () => {
      const script = buildRenderScript({
        videoClips: [{ url: "https://example.com/video.mp4" }],
        textOverlays: [
          {
            text: "Hello World",
            fontSize: 48,
            color: "#FFFFFF",
          },
        ],
      });

      expect(script.elements).toHaveLength(2);
      expect(script.elements[1].type).toBe("text");
      expect(script.elements[1].text).toBe("Hello World");
    });

    it("should use custom canvas dimensions", () => {
      const script = buildRenderScript({
        width: 1280,
        height: 720,
        videoClips: [{ url: "https://example.com/video.mp4" }],
      });

      expect(script.canvas.width).toBe(1280);
      expect(script.canvas.height).toBe(720);
    });

    it("should use custom duration", () => {
      const script = buildRenderScript({
        duration: 120,
        videoClips: [{ url: "https://example.com/video.mp4" }],
      });

      expect(script.canvas.duration).toBe(120);
    });

    it("should use custom background color", () => {
      const script = buildRenderScript({
        backgroundColor: "#FF0000",
        videoClips: [{ url: "https://example.com/video.mp4" }],
      });

      expect(script.canvas.backgroundColor).toBe("#FF0000");
    });

    it("should set default values for missing options", () => {
      const script = buildRenderScript({
        videoClips: [{ url: "https://example.com/video.mp4" }],
      });

      expect(script.canvas.width).toBe(1920);
      expect(script.canvas.height).toBe(1080);
      expect(script.canvas.duration).toBe(60);
      expect(script.canvas.backgroundColor).toBe("#000000");
    });
  });

  describe("submitRenderJob", () => {
    it("should submit render job successfully", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: "job-123" }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const jobId = await submitRenderJob("test-key", { canvas: {}, elements: [] });

      expect(jobId).toBe("job-123");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.creatomate.com/render",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-key",
          }),
        })
      );
    });

    it("should throw error on API failure", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(submitRenderJob("invalid-key", { canvas: {}, elements: [] })).rejects.toThrow(
        "Creatomate error"
      );
    });

    it("should use correct output format", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: "job-456" }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await submitRenderJob("test-key", { canvas: {}, elements: [] }, "webm");

      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.output.format).toBe("webm");
    });
  });

  describe("getRenderJobStatus", () => {
    it("should get render job status", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          id: "job-123",
          status: "completed",
          output: { url: "https://example.com/video.mp4" },
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const job = await getRenderJobStatus("test-key", "job-123");

      expect(job.id).toBe("job-123");
      expect(job.status).toBe("completed");
      expect(job.output?.url).toBe("https://example.com/video.mp4");
    });

    it("should call correct endpoint", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: "job-789", status: "processing" }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await getRenderJobStatus("test-key", "job-789");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.creatomate.com/render/job-789",
        expect.any(Object)
      );
    });

    it("should include API key in headers", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: "job-999", status: "queued" }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await getRenderJobStatus("my-secret-key", "job-999");

      const callArgs = (global.fetch as any).mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBe("Bearer my-secret-key");
    });

    it("should throw error on API failure", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        text: async () => "Not found",
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(getRenderJobStatus("test-key", "invalid-job")).rejects.toThrow("Creatomate error");
    });
  });

  describe("validateApiKey", () => {
    it("should return true for valid API key", async () => {
      const mockResponse = {
        ok: true,
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const isValid = await validateApiKey("valid-key");
      expect(isValid).toBe(true);
    });

    it("should return false for invalid API key", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const isValid = await validateApiKey("invalid-key");
      expect(isValid).toBe(false);
    });

    it("should return false on network error", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const isValid = await validateApiKey("test-key");
      expect(isValid).toBe(false);
    });

    it("should call account endpoint", async () => {
      const mockResponse = {
        ok: true,
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await validateApiKey("test-key");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.creatomate.com/account",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-key",
          }),
        })
      );
    });
  });
});
