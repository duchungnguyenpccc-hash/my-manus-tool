import { objectiveEngine, type OptimizationProfileState } from "./objectiveEngine";

export type BudgetDecision = {
  costMode: "LOCAL" | "CLOUD" | "AUTO";
  providerBias: "local" | "cloud";
  rationale: string;
  recommendedBudget: number;
  estimatedRoi: number;
};

export const budgetEngine = {
  async allocate(input: {
    userId: number;
    nicheId: number;
    viralScore: number;
    estimatedViews?: number;
    estimatedRevenue?: number;
    costPerVideo?: number;
    profile?: OptimizationProfileState;
  }): Promise<BudgetDecision> {
    const profile = input.profile ?? (await objectiveEngine.getProfile(input.userId, input.nicheId));
    const estimatedRevenue = input.estimatedRevenue ?? profile.budgetPolicy.estimatedRevenuePerVideo;
    const expectedCost = input.costPerVideo ?? profile.budgetPolicy.targetCostPerVideo;
    const roi = estimatedRevenue / Math.max(1, expectedCost);
    const recommendedBudget = Number(
      (expectedCost * profile.budgetPolicy.roiMultiplier * (input.viralScore >= 75 ? 1.2 : 0.9)).toFixed(2)
    );

    if (roi >= 1.35 || input.viralScore >= 82) {
      return {
        costMode: "CLOUD",
        providerBias: "cloud",
        rationale: "ROI momentum and predicted upside justify premium spend.",
        recommendedBudget,
        estimatedRoi: Number(roi.toFixed(3)),
      };
    }

    if (roi <= 0.95) {
      return {
        costMode: "LOCAL",
        providerBias: "local",
        rationale: "Low ROI pattern should conserve spend and rely on cheaper execution.",
        recommendedBudget,
        estimatedRoi: Number(roi.toFixed(3)),
      };
    }

    return {
      costMode: "AUTO",
      providerBias: profile.productionPolicy.contentStyle === "aggressive" ? "cloud" : "local",
      rationale: "Budget follows rolling ROI and the niche's live production policy.",
      recommendedBudget,
      estimatedRoi: Number(roi.toFixed(3)),
    };
  },
};
