import { describe, expect, it } from "vitest";
import { objectiveEngine } from "./objectiveEngine";

describe("objective engine", () => {
  it("scores outcomes against the rolling objective baseline", () => {
    const baseline = objectiveEngine.createDefaultProfile(1, 1).performanceBaseline;
    const result = objectiveEngine.evaluateObjective({
      baseline,
      metrics: {
        views: baseline.averageViews * 2,
        watchTimeMinutes: baseline.averageWatchTimeMinutes * 1.5,
        revenue: baseline.averageRevenue * 1.8,
        ctr: 6,
        retention: 60,
      },
    });

    expect(result.objectiveScore).toBeGreaterThan(1);
    expect(result.status).toBe("WIN");
  });

  it("reinforces and normalizes factor weights after a win", () => {
    const profile = objectiveEngine.createDefaultProfile(1, 1);
    const next = objectiveEngine.applyReinforcement(profile, { ctr: 1, retention: 0.5, demand: 0.25 }, true);
    const total = next.ctr + next.retention + next.demand;

    expect(total).toBeCloseTo(1, 5);
    expect(next.ctr).toBeGreaterThan(next.demand);
  });

  it("blacklists repeated failed patterns and clears pressure on wins", () => {
    const profile = objectiveEngine.createDefaultProfile(1, 1);
    objectiveEngine.updateBlacklist(profile, "Hidden ai finance strategy", false);
    objectiveEngine.updateBlacklist(profile, "Hidden ai finance strategy", false);
    objectiveEngine.updateBlacklist(profile, "Hidden ai finance strategy", false);

    expect(profile.blacklistedPatterns.length).toBeGreaterThan(0);
    expect(profile.blacklistedPatterns.some((pattern) => "hidden ai finance strategy".includes(pattern))).toBe(true);
  });
});
