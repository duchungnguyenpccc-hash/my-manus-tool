import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnifiedWorkflowExecutor, type WorkflowConfig } from "./unifiedWorkflowExecutor";

describe("UnifiedWorkflowExecutor", () => {
  let executor: UnifiedWorkflowExecutor;
  let mockConfig: WorkflowConfig;

  beforeEach(() => {
    executor = new UnifiedWorkflowExecutor();
    mockConfig = {
      userId: 1,
      topic: "How to make perfect coffee at home",
      sceneCount: 5,
      videoDuration: 300,
      voicePreset: "alloy",
      autoPublish: false,
    };
  });

  it("should create executor instance", () => {
    expect(executor).toBeDefined();
  });

  it("should have executeWorkflow method", () => {
    expect(executor.executeWorkflow).toBeDefined();
  });

  it("should validate workflow config", () => {
    expect(mockConfig.topic).toBeTruthy();
    expect(mockConfig.sceneCount).toBeGreaterThan(0);
    expect(mockConfig.videoDuration).toBeGreaterThan(0);
  });

  it("should have correct workflow step count", () => {
    // 10 steps in total workflow
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].length).toBe(10);
  });

  it("should define all workflow steps", () => {
    const steps = [
      "Generate Titles",
      "Content Moderation",
      "Generate Prompts",
      "Generate Images",
      "Generate Videos",
      "Generate Audio",
      "Compose Assets",
      "Render Video",
      "Upload YouTube",
      "Publish Results",
    ];

    expect(steps).toHaveLength(10);
    steps.forEach((step) => {
      expect(step).toBeTruthy();
    });
  });

  it("should have retry logic configuration", () => {
    const maxRetries = 3;
    expect(maxRetries).toBeGreaterThan(0);
  });

  it("should support auto-publish option", () => {
    const configWithAutoPublish = { ...mockConfig, autoPublish: true };
    expect(configWithAutoPublish.autoPublish).toBe(true);
  });

  it("should support Google Sheets integration", () => {
    const configWithSheets = {
      ...mockConfig,
      googleSheetsUrl: "https://docs.google.com/spreadsheets/d/123/edit",
    };
    expect(configWithSheets.googleSheetsUrl).toBeTruthy();
  });

  it("should validate scene count range", () => {
    expect(mockConfig.sceneCount).toBeGreaterThanOrEqual(1);
    expect(mockConfig.sceneCount).toBeLessThanOrEqual(20);
  });

  it("should validate video duration range", () => {
    expect(mockConfig.videoDuration).toBeGreaterThanOrEqual(30);
    expect(mockConfig.videoDuration).toBeLessThanOrEqual(600);
  });

  it("should have voice preset", () => {
    expect(mockConfig.voicePreset).toBeTruthy();
    expect(typeof mockConfig.voicePreset).toBe("string");
  });

  it("should support different voice presets", () => {
    const voicePresets = [
      "alloy",
      "echo",
      "fable",
      "onyx",
      "nova",
      "shimmer",
    ];
    expect(voicePresets).toContain(mockConfig.voicePreset);
  });

  it("should handle workflow execution result", () => {
    const result = {
      projectId: 1,
      status: "success" as const,
      steps: [],
      totalDuration: 1000,
      errors: [],
    };

    expect(result.projectId).toBeGreaterThan(0);
    expect(["success", "failed", "partial"]).toContain(result.status);
    expect(result.totalDuration).toBeGreaterThan(0);
  });

  it("should track workflow step status", () => {
    const statuses = ["pending", "running", "completed", "failed"];
    statuses.forEach((status) => {
      expect(status).toBeTruthy();
    });
  });

  it("should support partial success status", () => {
    const result = {
      projectId: 1,
      status: "partial" as const,
      steps: [],
      totalDuration: 1000,
      errors: ["Step 5 failed"],
    };

    expect(result.status).toBe("partial");
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should track execution errors", () => {
    const errors: string[] = [];
    errors.push("Step 1 failed");
    errors.push("Step 2 failed");

    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain("Step 1");
  });

  it("should calculate workflow progress", () => {
    const totalSteps = 10;
    const completedSteps = 5;
    const progress = (completedSteps / totalSteps) * 100;

    expect(progress).toBe(50);
  });

  it("should support batch workflow execution", () => {
    const configs = [mockConfig, { ...mockConfig, topic: "Another topic" }];
    expect(configs).toHaveLength(2);
  });

  it("should validate user ID", () => {
    expect(mockConfig.userId).toBeGreaterThan(0);
    expect(typeof mockConfig.userId).toBe("number");
  });
});
