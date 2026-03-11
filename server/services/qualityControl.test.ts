import { describe, it, expect } from "vitest";
import * as qualityControlService from "./qualityControlService";
import * as costTrackingService from "./costTrackingService";
import * as contentFingerprintingService from "./contentFingerprintingService";

describe("Quality Control Service", () => {
  it("should assess hook quality", async () => {
    const result = await qualityControlService.assessHookQuality(
      "Discover the shocking truth about AI that doctors don't want you to know!"
    );
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.issues)).toBe(true);
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it("should assess script quality", async () => {
    const script = `
      Hello everyone! Today I'm going to show you something incredible.
      This is the introduction to our video.
      We'll cover three main points in this video.
      First, we'll discuss the basics.
      Second, we'll explore advanced concepts.
      Finally, we'll wrap up with key takeaways.
      Don't forget to like and subscribe!
    `;
    const result = await qualityControlService.assessScriptQuality(script);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("should assess thumbnail quality", async () => {
    const result = await qualityControlService.assessThumbnailQuality(
      "https://example.com/thumbnail.jpg"
    );
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("should predict video performance", async () => {
    const prediction = await qualityControlService.predictVideoPerformance(
      "Shocking AI discovery",
      "The Future of AI",
      "education",
      ["AI", "technology", "future"]
    );
    expect(prediction.estimatedCTR).toBeGreaterThan(0);
    expect(prediction.estimatedRetention).toBeGreaterThan(0);
    expect(prediction.confidence).toBeGreaterThan(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
  });

  it("should perform full quality check", async () => {
    const result = await qualityControlService.performFullQualityCheck({
      videoId: "test-video-1",
      hook: "Discover the shocking truth!",
      script: "Hello everyone, today we're discussing...",
      title: "The Future of AI",
      thumbnailUrl: "https://example.com/thumb.jpg",
      audioUrl: "https://example.com/audio.mp3",
      category: "education",
      tags: ["AI", "technology"],
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["APPROVED", "PENDING_REVIEW", "REJECTED"]).toContain(result.status);
  });

  it("should get quality check history", async () => {
    const history = await qualityControlService.getQualityCheckHistory("channel-1");
    expect(Array.isArray(history)).toBe(true);
  });

  it("should get quality metrics summary", async () => {
    const summary = await qualityControlService.getQualityMetricsSummary("channel-1");
    expect(summary.totalVideosChecked).toBeGreaterThanOrEqual(0);
    expect(summary.approvedCount).toBeGreaterThanOrEqual(0);
    expect(summary.averageScore).toBeGreaterThanOrEqual(0);
  });
});

describe("Cost Tracking Service", () => {
  it("should calculate API cost", () => {
    const cost = costTrackingService.calculateApiCost("openai", "gpt-4", 1000, 500);
    expect(cost).toBeGreaterThan(0);
  });

  it("should get video cost summary", async () => {
    const summary = await costTrackingService.getVideoCostSummary("video-1");
    expect(summary.totalCost).toBeGreaterThan(0);
    expect(summary.costPerVideo).toBeGreaterThan(0);
    expect(typeof summary.costByService).toBe("object");
  });

  it("should get cost summary by period", async () => {
    const startDate = new Date("2026-03-01");
    const endDate = new Date("2026-03-31");
    const summary = await costTrackingService.getCostSummaryByPeriod(startDate, endDate);
    expect(summary.totalCost).toBeGreaterThan(0);
    expect(summary.videosProcessed).toBeGreaterThan(0);
  });

  it("should get optimization recommendations", async () => {
    const recommendations = await costTrackingService.getOptimizationRecommendations();
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);
    recommendations.forEach((rec) => {
      expect(rec.savingsPercentage).toBeGreaterThan(0);
    });
  });

  it("should optimize with batching", async () => {
    const result = await costTrackingService.optimizeWithBatching({
      title: "AI Trends",
      topic: "Artificial Intelligence",
      category: "education",
      trendingHooks: ["Hook 1", "Hook 2"],
    });
    expect(result.optimizedCost).toBeLessThan(result.originalCost);
    expect(result.savings).toBeGreaterThan(0);
  });

  it("should optimize with multi-model strategy", async () => {
    const result = await costTrackingService.optimizeWithMultiModel(
      "script_writing",
      "high"
    );
    expect(result.selectedModel).toBeDefined();
    expect(result.service).toBeDefined();
    expect(result.estimatedCost).toBeGreaterThan(0);
  });

  it("should estimate scaling cost", async () => {
    const estimate = await costTrackingService.estimateScalingCost(100);
    expect(estimate.videosPerDay).toBe(100);
    expect(estimate.monthlyCost).toBeGreaterThan(0);
    expect(estimate.withOptimization.monthlyCost).toBeLessThan(estimate.monthlyCost);
  });

  it("should get ROI analysis", async () => {
    const roi = await costTrackingService.getROIAnalysis(10, 50000, 4, 0.5);
    expect(roi.dailyRevenue).toBeGreaterThan(0);
    expect(roi.monthlyProfit).toBeGreaterThan(0);
    expect(roi.roi).toBeGreaterThan(0);
  });
});

describe("Content Fingerprinting Service", () => {
  it("should compute perceptual hash", async () => {
    const hash = await contentFingerprintingService.computePerceptualHash(
      "https://example.com/video.mp4"
    );
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("should compute script hash", async () => {
    const hash = await contentFingerprintingService.computeScriptHash(
      "This is a test script"
    );
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("should check content duplicate", async () => {
    const result = await contentFingerprintingService.checkContentDuplicate(
      "https://example.com/video.mp4",
      "Test script content",
      "channel-1"
    );
    expect(result.isDuplicate).toBeDefined();
    expect(result.similarity).toBeGreaterThanOrEqual(0);
    expect(result.similarity).toBeLessThanOrEqual(100);
    expect(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(result.riskLevel);
  });

  it("should check script similarity", async () => {
    const result = await contentFingerprintingService.checkScriptSimilarity(
      "AI is transforming the world",
      "education"
    );
    expect(result.similarity).toBeGreaterThanOrEqual(0);
    expect(result.similarity).toBeLessThanOrEqual(100);
    expect(["LOW", "MEDIUM", "HIGH"]).toContain(result.riskLevel);
  });

  it("should check compliance", async () => {
    const result = await contentFingerprintingService.checkCompliance(
      "This is a normal script",
      "Normal Title",
      ["tag1", "tag2"]
    );
    expect(typeof result.isSafe).toBe("boolean");
    expect(result.toxicityScore).toBeGreaterThanOrEqual(0);
    expect(result.toxicityScore).toBeLessThanOrEqual(1);
  });

  it("should perform full content check", async () => {
    const result = await contentFingerprintingService.performFullContentCheck(
      "https://example.com/video.mp4",
      "Test script",
      "Test Title",
      ["tag1", "tag2"],
      "education",
      "channel-1"
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["APPROVED", "PENDING_REVIEW", "REJECTED"]).toContain(result.status);
  });

  it("should get content check history", async () => {
    const history = await contentFingerprintingService.getContentCheckHistory("channel-1");
    expect(Array.isArray(history)).toBe(true);
  });

  it("should get compliance summary", async () => {
    const summary = await contentFingerprintingService.getComplianceSummary("channel-1");
    expect(summary.totalVideosChecked).toBeGreaterThanOrEqual(0);
    expect(summary.approvedCount).toBeGreaterThanOrEqual(0);
    expect(summary.averageScore).toBeGreaterThanOrEqual(0);
  });
});
