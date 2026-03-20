import { describe, expect, it } from "vitest";
import { competitionEngine } from "./competitionEngine";

describe("competition engine", () => {
  it("returns competitive difficulty and timing for a topic", async () => {
    const result = await competitionEngine.analyzeTopic("faceless finance automation");

    expect(result.averageViews).toBeGreaterThan(0);
    expect(result.averageChannelSize).toBeGreaterThan(0);
    expect(result.competitionScore).toBeGreaterThanOrEqual(0);
    expect(["low", "medium", "high"]).toContain(result.difficulty);
    expect(result.timingScore).toBeGreaterThan(0);
  });
});
