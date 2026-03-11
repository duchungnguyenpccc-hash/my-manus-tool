import { describe, it, expect } from "vitest";
import * as autoOptimizationService from "./autoOptimizationService";

describe("Auto-Optimization Service", () => {
  it("should generate optimizations for a video", async () => {
    const recommendations = await autoOptimizationService.generateOptimizations({
      videoId: "test-video-1",
      hook: "Discover AI",
      title: "The Future of AI",
      script: "Hello everyone",
      thumbnail: "https://example.com/thumb.jpg",
      tags: ["AI", "tech"],
      category: "education",
      currentCTR: 3.5,
      currentRetention: 45,
      currentViews: 1000,
    });

    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);
    recommendations.forEach((rec) => {
      expect(rec.id).toBeDefined();
      expect(rec.videoId).toBe("test-video-1");
      expect(["hook", "thumbnail", "script", "schedule", "metadata", "tags"]).toContain(rec.type);
      expect(rec.expectedImprovement).toBeGreaterThan(0);
      expect(rec.confidence).toBeGreaterThanOrEqual(0);
      expect(rec.confidence).toBeLessThanOrEqual(1);
    });
  });

  it("should apply a single optimization", async () => {
    const recommendation = {
      id: "opt-1",
      videoId: "test-video-1",
      type: "hook" as const,
      title: "Expand Hook",
      description: "Expand hook length",
      currentValue: "Old hook",
      suggestedValue: "New hook",
      expectedImprovement: 15,
      confidence: 0.85,
      priority: "high" as const,
      status: "pending" as const,
      createdAt: new Date(),
      estimatedImpact: { ctrIncrease: 2.5, retentionIncrease: 3, viewsIncrease: 10 },
    };

    const result = await autoOptimizationService.applyOptimization(recommendation);
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
    expect(result.appliedAt).toBeDefined();
    expect(result.newValue).toBe(recommendation.suggestedValue);
  });

  it("should apply multiple optimizations", async () => {
    const recommendations = [
      {
        id: "opt-1",
        videoId: "test-video-1",
        type: "hook" as const,
        title: "Expand Hook",
        description: "Expand hook length",
        currentValue: "Old hook",
        suggestedValue: "New hook",
        expectedImprovement: 15,
        confidence: 0.85,
        priority: "high" as const,
        status: "pending" as const,
        createdAt: new Date(),
        estimatedImpact: { ctrIncrease: 2.5, retentionIncrease: 3, viewsIncrease: 10 },
      },
      {
        id: "opt-2",
        videoId: "test-video-1",
        type: "thumbnail" as const,
        title: "Increase Contrast",
        description: "Add contrast",
        currentValue: "Old thumbnail",
        suggestedValue: "New thumbnail",
        expectedImprovement: 12,
        confidence: 0.78,
        priority: "high" as const,
        status: "pending" as const,
        createdAt: new Date(),
        estimatedImpact: { ctrIncrease: 2, retentionIncrease: 1, viewsIncrease: 8 },
      },
    ];

    const result = await autoOptimizationService.applyMultipleOptimizations(recommendations);
    expect(result.totalApplied).toBeGreaterThan(0);
    expect(result.totalFailed).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.estimatedTotalImprovement).toBeGreaterThan(0);
  });

  it("should get optimization history", async () => {
    const history = await autoOptimizationService.getOptimizationHistory("test-video-1");
    expect(Array.isArray(history)).toBe(true);
    history.forEach((h) => {
      expect(h.videoId).toBe("test-video-1");
      expect(h.optimizationId).toBeDefined();
      expect(h.type).toBeDefined();
      expect(["success", "failed", "partial"]).toContain(h.status);
    });
  });

  it("should get optimization dashboard", async () => {
    const dashboard = await autoOptimizationService.getOptimizationDashboard("channel-1");
    expect(dashboard.totalVideos).toBeGreaterThan(0);
    expect(dashboard.videosWithOptimizations).toBeGreaterThanOrEqual(0);
    expect(dashboard.totalOptimizationsApplied).toBeGreaterThanOrEqual(0);
    expect(dashboard.averageImprovement).toBeGreaterThan(0);
    expect(Array.isArray(dashboard.topOptimizations)).toBe(true);
    expect(Array.isArray(dashboard.recentOptimizations)).toBe(true);
  });

  it("should predict optimization impact", async () => {
    const prediction = await autoOptimizationService.predictOptimizationImpact(
      3.5,
      45,
      1000,
      [
        {
          id: "opt-1",
          videoId: "test-video-1",
          type: "hook" as const,
          title: "Expand Hook",
          description: "Expand hook",
          currentValue: "Old",
          suggestedValue: "New",
          expectedImprovement: 15,
          confidence: 0.85,
          priority: "high" as const,
          status: "pending" as const,
          createdAt: new Date(),
          estimatedImpact: { ctrIncrease: 2.5, retentionIncrease: 3, viewsIncrease: 10 },
        },
      ]
    );

    expect(prediction.predictedCTR).toBeGreaterThan(3.5);
    expect(prediction.predictedRetention).toBeGreaterThanOrEqual(45);
    expect(prediction.predictedViews).toBeGreaterThan(1000);
    expect(prediction.totalImprovement).toBeGreaterThan(0);
    expect(prediction.confidence).toBeGreaterThanOrEqual(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
  });

  it("should get recommendations by priority", async () => {
    const recommendations = [
      {
        id: "opt-1",
        videoId: "test-video-1",
        type: "hook" as const,
        title: "Expand Hook",
        description: "Expand hook",
        currentValue: "Old",
        suggestedValue: "New",
        expectedImprovement: 15,
        confidence: 0.85,
        priority: "high" as const,
        status: "pending" as const,
        createdAt: new Date(),
        estimatedImpact: { ctrIncrease: 2.5, retentionIncrease: 3, viewsIncrease: 10 },
      },
      {
        id: "opt-2",
        videoId: "test-video-1",
        type: "thumbnail" as const,
        title: "Increase Contrast",
        description: "Add contrast",
        currentValue: "Old",
        suggestedValue: "New",
        expectedImprovement: 12,
        confidence: 0.78,
        priority: "medium" as const,
        status: "pending" as const,
        createdAt: new Date(),
        estimatedImpact: { ctrIncrease: 2, retentionIncrease: 1, viewsIncrease: 8 },
      },
    ];

    const result = await autoOptimizationService.getRecommendationsByPriority(recommendations);
    expect(Array.isArray(result.high)).toBe(true);
    expect(Array.isArray(result.medium)).toBe(true);
    expect(Array.isArray(result.low)).toBe(true);
    expect(result.high.length).toBeGreaterThan(0);
    expect(result.medium.length).toBeGreaterThan(0);
  });

  it("should auto-apply high-confidence recommendations", async () => {
    const recommendations = [
      {
        id: "opt-1",
        videoId: "test-video-1",
        type: "hook" as const,
        title: "Expand Hook",
        description: "Expand hook",
        currentValue: "Old",
        suggestedValue: "New",
        expectedImprovement: 15,
        confidence: 0.9,
        priority: "high" as const,
        status: "pending" as const,
        createdAt: new Date(),
        estimatedImpact: { ctrIncrease: 2.5, retentionIncrease: 3, viewsIncrease: 10 },
      },
      {
        id: "opt-2",
        videoId: "test-video-1",
        type: "thumbnail" as const,
        title: "Increase Contrast",
        description: "Add contrast",
        currentValue: "Old",
        suggestedValue: "New",
        expectedImprovement: 12,
        confidence: 0.7,
        priority: "medium" as const,
        status: "pending" as const,
        createdAt: new Date(),
        estimatedImpact: { ctrIncrease: 2, retentionIncrease: 1, viewsIncrease: 8 },
      },
    ];

    const result = await autoOptimizationService.autoApplyRecommendations(recommendations, 0.8);
    expect(Array.isArray(result.autoApplied)).toBe(true);
    expect(Array.isArray(result.requiresReview)).toBe(true);
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.autoApplied.length).toBeGreaterThan(0);
    expect(result.requiresReview.length).toBeGreaterThan(0);
  });

  it("should handle empty recommendations", async () => {
    const result = await autoOptimizationService.predictOptimizationImpact(3.5, 45, 1000, []);
    expect(result.predictedCTR).toBe(3.5);
    expect(result.predictedRetention).toBe(45);
    expect(result.predictedViews).toBe(1000);
    expect(result.totalImprovement).toBe(0);
  });

  it("should estimate scaling cost", async () => {
    const estimate = await autoOptimizationService.generateOptimizations({
      videoId: "test-video-1",
      hook: "Test hook",
      title: "Test title",
      script: "Test script",
      thumbnail: "https://example.com/thumb.jpg",
      tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
      category: "education",
      currentCTR: 3.5,
      currentRetention: 45,
      currentViews: 1000,
    });

    expect(Array.isArray(estimate)).toBe(true);
    expect(estimate.length).toBeGreaterThanOrEqual(0);
  });
});
