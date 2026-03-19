export type BudgetDecision = {
  costMode: "LOCAL" | "CLOUD" | "AUTO";
  providerBias: "local" | "cloud";
  rationale: string;
};

export const budgetEngine = {
  allocate(input: { viralScore: number; dailyVideoQuota?: number; monthlyBudget?: number }): BudgetDecision {
    const monthlyBudget = input.monthlyBudget ?? 0;
    const dailyQuota = input.dailyVideoQuota ?? 0;

    if (input.viralScore >= 80) {
      return {
        costMode: "CLOUD",
        providerBias: "cloud",
        rationale: "High viral potential justifies premium provider spend.",
      };
    }

    if (monthlyBudget > 0 && dailyQuota > 0 && monthlyBudget / Math.max(1, dailyQuota * 30) < 3) {
      return {
        costMode: "LOCAL",
        providerBias: "local",
        rationale: "Budget per video is constrained, so local providers are favored.",
      };
    }

    return {
      costMode: "AUTO",
      providerBias: input.viralScore >= 65 ? "cloud" : "local",
      rationale: "Balanced mode adapts spend to estimated upside.",
    };
  },
};
