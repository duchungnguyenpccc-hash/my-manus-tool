import { describe, expect, it } from "vitest";
import {
  calculateTopicNoveltyScore,
  rankTopicsByViralPotential,
} from "./youtubeAlgorithmSimulatorService";
import { scoreHookRetentionPotential, selectBestHook } from "./enhancedHookGeneratorService";
import { scoreThumbnailConcept, selectBestThumbnailDesign } from "./thumbnailOptimizerService";
import { scoreTitleCTRPotential, selectBestTitleVariation } from "./titleGenerationService";
import { calculateSemanticSimilarity } from "./contentFingerprintingService";
import { strategyEngine } from "./strategyEngine";

describe("growth engine scoring primitives", () => {
  it("ranks viral topics and enforces top-N selection", async () => {
    const result = await rankTopicsByViralPotential({
      topics: [
        { topic: "AI automation secrets for small business growth" },
        { topic: "basic company update and announcements" },
        { topic: "How to use AI to save 10 hours per week" },
      ],
      threshold: 55,
      topN: 2,
    });

    expect(result.ranked).toHaveLength(3);
    expect(result.selected.length).toBeLessThanOrEqual(2);
    expect(result.ranked[0].scores.viralProbability).toBeGreaterThanOrEqual(
      result.ranked[1].scores.viralProbability
    );
  });

  it("strategy engine keeps only the top ~20 percent of ranked topics", async () => {
    const ranked = await strategyEngine.rankTopics({
      topics: Array.from({ length: 10 }, (_, index) => ({
        topic: `How to scale faceless channel idea ${index + 1}`,
      })),
      topN: 2,
    });

    expect(ranked.selected.length).toBeLessThanOrEqual(2);
    expect(ranked.ranked[0].curiosityScore).toBeGreaterThanOrEqual(0);
    expect(ranked.ranked[0].clickPotential).toBeGreaterThanOrEqual(0);
  });

  it("calculates novelty from topic overlap", () => {
    const highNovelty = calculateTopicNoveltyScore("AI workflow monetization strategy", [
      "gardening tips for spring",
      "retro gaming secrets",
    ]);
    const lowNovelty = calculateTopicNoveltyScore("AI workflow monetization strategy", [
      "AI workflow monetization strategy for creators",
    ]);

    expect(highNovelty).toBeGreaterThan(lowNovelty);
  });

  it("selects the strongest hook by retention potential", () => {
    const hooks = [
      {
        hook: "Today we discuss updates.",
        type: "statement" as const,
        emotionTrigger: "neutral",
        engagementScore: 55,
        reasoning: "Plain.",
        bestFor: "general",
      },
      {
        hook: "Before you waste another hour, watch this AI shortcut that creators use to grow fast.",
        type: "urgency" as const,
        emotionTrigger: "urgency",
        engagementScore: 82,
        reasoning: "Specific and curiosity-driven.",
        bestFor: "growth",
      },
    ];

    expect(scoreHookRetentionPotential(hooks[1].hook)).toBeGreaterThan(
      scoreHookRetentionPotential(hooks[0].hook)
    );
    expect(selectBestHook(hooks).hook).toBe(hooks[1].hook);
  });

  it("selects the best thumbnail concept by CTR signals", () => {
    const designs = [
      {
        title: "Plain",
        description: "Minimal",
        colorScheme: { primary: "#111111", secondary: "#222222", accent: "#333333", textColor: "#ffffff" },
        textSuggestions: ["update"],
        designElements: ["icon"],
        emotionTriggers: [],
        predictedCTR: 4,
        reasoning: "Basic",
      },
      {
        title: "High Contrast",
        description: "Close-up face with red arrow",
        colorScheme: { primary: "#ff0000", secondary: "#000000", accent: "#ffff00", textColor: "#ffffff" },
        textSuggestions: ["STOP", "THIS"],
        designElements: ["face close-up", "arrow", "highlight"],
        emotionTriggers: ["surprise", "urgency"],
        predictedCTR: 12,
        reasoning: "Strong contrast and emotional cue for mobile CTR.",
      },
    ];

    expect(scoreThumbnailConcept(designs[1])).toBeGreaterThan(scoreThumbnailConcept(designs[0]));
    expect(selectBestThumbnailDesign(designs).title).toBe("High Contrast");
  });

  it("scores title CTR potential and picks the strongest title", () => {
    const titles = [
      {
        mainTitle: "Weekly update",
        shortTitle: "Update",
        seoTitle: "Weekly update",
        description: "desc",
        tags: [],
        keywords: [],
      },
      {
        mainTitle: "How to Use AI to Save 10 Hours a Week",
        shortTitle: "Save 10 Hours",
        seoTitle: "How to Use AI to Save 10 Hours a Week for Creators",
        description: "desc",
        tags: [],
        keywords: [],
      },
    ];

    expect(scoreTitleCTRPotential(titles[1].mainTitle)).toBeGreaterThan(
      scoreTitleCTRPotential(titles[0].mainTitle)
    );
    expect(selectBestTitleVariation(titles).mainTitle).toBe(titles[1].mainTitle);
  });

  it("uses semantic similarity instead of random duplication checks", () => {
    expect(
      calculateSemanticSimilarity(
        "AI automation workflow for monetization",
        "AI automation workflow for monetization and scaling"
      )
    ).toBeGreaterThan(
      calculateSemanticSimilarity("AI automation workflow for monetization", "gardening basics for beginners")
    );
  });

  it("exposes strategy-engine topic scoring shape", async () => {
    const result = await strategyEngine.scoreTopic({
      topic: "How to use AI to grow a faceless YouTube channel",
      historicalTopics: ["basic gardening tips", "retro gaming review"],
    });

    expect(result.viralProbability).toBeGreaterThanOrEqual(0);
    expect(result.viralProbability).toBeLessThanOrEqual(100);
    expect(result.noveltyScore).toBeGreaterThanOrEqual(0);
    expect(result.predictedCTR).toBeGreaterThanOrEqual(0);
    expect(result.predictedRetention).toBeGreaterThanOrEqual(0);
  });
});
