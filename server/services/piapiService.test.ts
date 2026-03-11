import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTextToImageTask, createImageToVideoTask, getTaskStatus } from "./piapiService";

// Mock fetch
global.fetch = vi.fn();

describe("PiAPI Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTextToImageTask", () => {
    it("should create a text-to-image task with correct API call", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: "task-123" }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const taskId = await createTextToImageTask("test-api-key", {
        prompt: "A beautiful sunset over mountains",
        model: "qwen",
      });

      expect(taskId).toBe("task-123");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.piapi.ai/api/v1/task",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "X-API-Key": "test-api-key",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should throw error when API returns error status", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(
        createTextToImageTask("invalid-key", {
          prompt: "A test prompt",
        })
      ).rejects.toThrow("PiAPI error");
    });

    it("should use correct Qwen model mapping", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: "task-456" }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await createTextToImageTask("test-key", {
        prompt: "Test prompt",
        model: "qwen",
      });

      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.model).toBe("Qubico/qwen-vl-plus");
    });

    it("should use correct Flux model mapping", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: "task-789" }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await createTextToImageTask("test-key", {
        prompt: "Test prompt",
        model: "flux1-schnell",
      });

      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.model).toBe("Qubico/flux1-schnell");
    });

    it("should include prompt in request body", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: "task-999" }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const testPrompt = "A detailed landscape with mountains and rivers";
      await createTextToImageTask("test-key", {
        prompt: testPrompt,
      });

      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.input.prompt).toBe(testPrompt);
    });
  });

  describe("createImageToVideoTask", () => {
    it("should create an image-to-video task", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: "video-task-123" }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const taskId = await createImageToVideoTask("test-api-key", {
        imageUrl: "https://example.com/image.png",
        model: "veo3-image-to-video",
        duration: 5,
      });

      expect(taskId).toBe("video-task-123");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.piapi.ai/api/v1/task",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "X-API-Key": "test-api-key",
          }),
        })
      );
    });

    it("should use default prompt when not provided", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: "task-111" }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await createImageToVideoTask("test-key", {
        imageUrl: "https://example.com/image.png",
      });

      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.input.prompt).toBe("A smooth, cinematic video transition");
    });

    it("should use default duration of 5 seconds", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: "task-222" }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await createImageToVideoTask("test-key", {
        imageUrl: "https://example.com/image.png",
      });

      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.input.duration).toBe(5);
    });

    it("should use Veo3 model by default", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: "task-333" }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await createImageToVideoTask("test-key", {
        imageUrl: "https://example.com/image.png",
      });

      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.model).toBe("Veo3/image-to-video");
    });
  });

  describe("getTaskStatus", () => {
    it("should retrieve task status successfully", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          id: "task-123",
          status: "completed",
          result: {
            images: ["https://example.com/image.png"],
          },
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const status = await getTaskStatus("test-key", "task-123");

      expect(status.id).toBe("task-123");
      expect(status.status).toBe("completed");
      expect(status.result?.images).toHaveLength(1);
    });

    it("should call correct endpoint with task ID", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          id: "task-456",
          status: "processing",
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await getTaskStatus("test-key", "task-456");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.piapi.ai/api/v1/task/task-456",
        expect.any(Object)
      );
    });

    it("should include API key in headers", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          id: "task-789",
          status: "pending",
        }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await getTaskStatus("my-secret-key", "task-789");

      const callArgs = (global.fetch as any).mock.calls[0][1];
      expect(callArgs.headers["X-API-Key"]).toBe("my-secret-key");
    });

    it("should throw error on API failure", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        text: async () => "Not found",
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(getTaskStatus("test-key", "invalid-task")).rejects.toThrow("PiAPI error");
    });
  });
});
