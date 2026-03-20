import { describe, expect, it } from "vitest";
import { objectiveEngine } from "./objectiveEngine";
import { patternEngine } from "./patternEngine";

describe("pattern engine", () => {
  it("learns winning patterns and boosts similar future ideas", () => {
    const profile = objectiveEngine.createDefaultProfile(1, 7);
    patternEngine.learnFromOutcome({
      profile,
      nicheId: 7,
      topic: "How to automate faceless finance channel",
      title: "How to automate faceless finance channel",
      hook: "How to automate",
      won: true,
      objectiveScore: 1.8,
    });

    const score = patternEngine.scorePattern({
      profile,
      nicheId: 7,
      topic: "How to automate faceless investing content",
      title: "How to automate faceless investing content",
      hook: "How to automate",
    });

    expect(profile.winningPatterns.length).toBeGreaterThan(0);
    expect(score.netScore).toBeGreaterThan(0);
    expect(score.winningMatches.length).toBeGreaterThan(0);
  });

  it("penalizes patterns similar to losing ideas", () => {
    const profile = objectiveEngine.createDefaultProfile(1, 3);
    patternEngine.learnFromOutcome({
      profile,
      nicheId: 3,
      topic: "Secret crypto mistakes revealed",
      title: "Secret crypto mistakes revealed",
      hook: "Secret crypto mistakes",
      won: false,
      objectiveScore: 0.6,
    });

    const score = patternEngine.scorePattern({
      profile,
      nicheId: 3,
      topic: "Secret crypto mistakes to avoid",
      title: "Secret crypto mistakes to avoid",
      hook: "Secret crypto mistakes",
    });

    expect(profile.losingPatterns.length).toBeGreaterThan(0);
    expect(score.netScore).toBeLessThan(0);
    expect(score.losingMatches.length).toBeGreaterThan(0);
  });
});
