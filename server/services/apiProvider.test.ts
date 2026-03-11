import { describe, it, expect } from "vitest";
import * as apiProviderService from "./apiProviderService";

describe("API Provider Service", () => {
  it("should get providers by type", async () => {
    const providers = await apiProviderService.getProvidersByType("script");
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);
    providers.forEach((p) => {
      expect(p.type).toBe("script");
      expect(p.name).toBeDefined();
      expect(p.costPerUnit).toBeGreaterThanOrEqual(0);
    });
  });

  it("should calculate monthly cost", async () => {
    const result = await apiProviderService.calculateMonthlyCost(
      {
        script: "ollama",
        voice: "edge-tts",
        image: "stable-diffusion",
        video: "ffmpeg",
        music: "pexels",
        trending: "youtube-api",
      },
      10
    );

    expect(result.totalCost).toBe(0); // All free options
    expect(result.breakdown).toBeDefined();
    expect(result.savings).toBeGreaterThanOrEqual(0);
  });

  it("should get recommended providers based on budget", async () => {
    const recommended = await apiProviderService.getRecommendedProviders(100);
    expect(typeof recommended).toBe("object");
    expect(Object.keys(recommended).length).toBeGreaterThan(0);
  });

  it("should get provider stats", async () => {
    const stats = await apiProviderService.getProviderStats("openai");
    expect(stats.name).toBe("OpenAI GPT-4");
    expect(stats.quality).toBeGreaterThan(0);
    expect(stats.speed).toBeGreaterThan(0);
    expect(stats.reliability).toBeGreaterThan(0);
    expect(stats.isFree).toBe(false);
  });

  it("should compare multiple providers", async () => {
    const comparison = await apiProviderService.compareProviders("voice", [
      "elevenlabs",
      "edge-tts",
      "google-tts",
    ]);

    expect(Array.isArray(comparison)).toBe(true);
    expect(comparison.length).toBe(3);
    comparison.forEach((p) => {
      expect(p.id).toBeDefined();
      expect(p.name).toBeDefined();
      expect(p.quality).toBeGreaterThan(0);
    });
  });

  it("should get optimal provider by cost", async () => {
    const provider = await apiProviderService.getOptimalProvider("voice", "cost");
    expect(provider).toBeDefined();
    expect(provider?.isFree).toBe(true); // Should be free (cheapest)
  });

  it("should get optimal provider by quality", async () => {
    const provider = await apiProviderService.getOptimalProvider("voice", "quality");
    expect(provider).toBeDefined();
    expect(provider?.quality).toBeGreaterThanOrEqual(9); // Should be high quality
  });

  it("should get optimal provider by speed", async () => {
    const provider = await apiProviderService.getOptimalProvider("voice", "speed");
    expect(provider).toBeDefined();
    expect(provider?.speed).toBeGreaterThanOrEqual(8); // Should be fast
  });

  it("should get optimal provider with balanced priority", async () => {
    const provider = await apiProviderService.getOptimalProvider("script", "balanced");
    expect(provider).toBeDefined();
    expect(provider?.quality).toBeGreaterThan(0);
    expect(provider?.speed).toBeGreaterThan(0);
  });

  it("should handle all provider types", async () => {
    const types = ["script", "voice", "image", "video", "music", "trending"];

    for (const type of types) {
      const providers = await apiProviderService.getProvidersByType(type);
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.every((p) => p.type === type)).toBe(true);
    }
  });

  it("should have free options for all types", async () => {
    const types = ["script", "voice", "image", "video", "music", "trending"];

    for (const type of types) {
      const providers = await apiProviderService.getProvidersByType(type);
      const hasFree = providers.some((p) => p.isFree);
      expect(hasFree).toBe(true);
    }
  });

  it("should calculate cost difference between paid and free", async () => {
    const paidResult = await apiProviderService.calculateMonthlyCost(
      {
        script: "openai",
        voice: "elevenlabs",
        image: "creatomate",
        video: "creatomate",
        music: "epidemic",
        trending: "youtube-api",
      },
      10
    );

    const freeResult = await apiProviderService.calculateMonthlyCost(
      {
        script: "ollama",
        voice: "edge-tts",
        image: "stable-diffusion",
        video: "ffmpeg",
        music: "pexels",
        trending: "youtube-api",
      },
      10
    );

    expect(paidResult.totalCost).toBeGreaterThanOrEqual(freeResult.totalCost);
    expect(paidResult.savings).toBeGreaterThanOrEqual(0);
  });

  it("should return null for non-existent type", async () => {
    const providers = await apiProviderService.getProvidersByType("nonexistent");
    expect(providers.length).toBe(0);
  });

  it("should throw error for non-existent provider", async () => {
    try {
      await apiProviderService.getProviderStats("nonexistent-provider");
      expect.fail("Should have thrown error");
    } catch (error) {
      expect((error as Error).message).toContain("not found");
    }
  });

  it("should calculate cost scaling", async () => {
    const cost10 = await apiProviderService.calculateMonthlyCost(
      {
        script: "groq",
        voice: "edge-tts",
        image: "stable-diffusion",
        video: "ffmpeg",
        music: "pexels",
        trending: "youtube-api",
      },
      10
    );

    const cost100 = await apiProviderService.calculateMonthlyCost(
      {
        script: "groq",
        voice: "edge-tts",
        image: "stable-diffusion",
        video: "ffmpeg",
        music: "pexels",
        trending: "youtube-api",
      },
      100
    );

    expect(cost100.totalCost).toBeGreaterThanOrEqual(cost10.totalCost);
  });

  it("should have quality ratings between 1-10", async () => {
    const providers = await apiProviderService.getProvidersByType("script");
    providers.forEach((p) => {
      expect(p.quality).toBeGreaterThanOrEqual(1);
      expect(p.quality).toBeLessThanOrEqual(10);
      expect(p.speed).toBeGreaterThanOrEqual(1);
      expect(p.speed).toBeLessThanOrEqual(10);
      expect(p.reliability).toBeGreaterThanOrEqual(1);
      expect(p.reliability).toBeLessThanOrEqual(10);
    });
  });
});
