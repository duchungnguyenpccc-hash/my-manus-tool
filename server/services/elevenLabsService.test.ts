import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPresetVoiceId,
  estimateAudioDuration,
  getCharacterCount,
  validateApiKey,
} from "./elevenLabsService";

describe("ElevenLabs Service", () => {
  describe("getPresetVoiceId", () => {
    it("should return correct voice ID for adam", () => {
      const voiceId = getPresetVoiceId("adam");
      expect(voiceId).toBe("pNInz6obpgDQGcFmaJqB");
    });

    it("should return correct voice ID for bella", () => {
      const voiceId = getPresetVoiceId("bella");
      expect(voiceId).toBe("EXAVITQu4vr4xnSDxMaL");
    });

    it("should return correct voice ID for charlie", () => {
      const voiceId = getPresetVoiceId("charlie");
      expect(voiceId).toBe("IZSifFFhzhzhBBXNDAbw");
    });

    it("should return correct voice ID for dorothy", () => {
      const voiceId = getPresetVoiceId("dorothy");
      expect(voiceId).toBe("ThT5KcBeYPX3keUQqHcH");
    });

    it("should return correct voice ID for emily", () => {
      const voiceId = getPresetVoiceId("emily");
      expect(voiceId).toBe("LJ1OUsmbnFUDyDBRXnCY");
    });

    it("should return correct voice ID for ethan", () => {
      const voiceId = getPresetVoiceId("ethan");
      expect(voiceId).toBe("g5CIjZEefAQLP1BQnXzJ");
    });

    it("should return correct voice ID for george", () => {
      const voiceId = getPresetVoiceId("george");
      expect(voiceId).toBe("JBFqnCBsd6RMkjW5OWP1");
    });

    it("should return correct voice ID for grace", () => {
      const voiceId = getPresetVoiceId("grace");
      expect(voiceId).toBe("oWAxZDx7w5VEj9dCyTzz");
    });
  });

  describe("getCharacterCount", () => {
    it("should count characters correctly", () => {
      const text = "Hello world";
      expect(getCharacterCount(text)).toBe(11);
    });

    it("should count empty string as 0", () => {
      expect(getCharacterCount("")).toBe(0);
    });

    it("should count special characters", () => {
      const text = "Hello, world! 123 @#$";
      expect(getCharacterCount(text)).toBe(text.length);
    });

    it("should count spaces", () => {
      const text = "a b c d e";
      expect(getCharacterCount(text)).toBe(9);
    });

    it("should count unicode characters", () => {
      const text = "你好世界";
      expect(getCharacterCount(text)).toBe(4);
    });
  });

  describe("estimateAudioDuration", () => {
    it("should estimate duration for short text", () => {
      const text = "Hello world";
      const duration = estimateAudioDuration(text);
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5);
    });

    it("should estimate duration for longer text", () => {
      const text = "This is a longer piece of text that should take more time to speak. It has multiple sentences and covers various topics.";
      const duration = estimateAudioDuration(text);
      expect(duration).toBeGreaterThan(5);
    });

    it("should return at least 1 second for any text", () => {
      const text = "a";
      const duration = estimateAudioDuration(text);
      expect(duration).toBeGreaterThanOrEqual(1);
    });

    it("should scale with text length", () => {
      const shortText = "Hello";
      const longText = "Hello world. This is a much longer sentence with many more words.";

      const shortDuration = estimateAudioDuration(shortText);
      const longDuration = estimateAudioDuration(longText);

      expect(longDuration).toBeGreaterThan(shortDuration);
    });

    it("should handle empty string", () => {
      const duration = estimateAudioDuration("");
      expect(duration).toBe(0);
    });
  });

  describe("validateApiKey", () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

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

    it("should call correct endpoint", async () => {
      const mockResponse = {
        ok: true,
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await validateApiKey("test-key");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.elevenlabs.io/v1/user",
        expect.objectContaining({
          headers: expect.objectContaining({
            "xi-api-key": "test-key",
          }),
        })
      );
    });
  });
});
