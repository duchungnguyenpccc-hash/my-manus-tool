import { and, desc, eq } from "drizzle-orm";
import { campaigns } from "../../drizzle/schema";
import { getDb } from "../db";

export const campaignManagerService = {
  async createCampaign(params: {
    userId: number;
    nicheId: number;
    name: string;
    strategy?: Record<string, unknown>;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result: any = await db.insert(campaigns).values({
      userId: params.userId,
      nicheId: params.nicheId,
      name: params.name,
      strategy: this.normalizeStrategy(params.strategy),
      status: "active",
    });

    return { id: Number(result?.[0]?.insertId ?? result?.insertId ?? 0), success: true };
  },

  async listCampaigns(userId: number, nicheId?: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const rows = await db
      .select()
      .from(campaigns)
      .where(nicheId ? and(eq(campaigns.userId, userId), eq(campaigns.nicheId, nicheId)) : eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));

    return rows.map((row) => ({
      ...row,
      strategy: this.normalizeStrategy((row.strategy ?? {}) as Record<string, unknown>),
    }));
  },

  normalizeStrategy(strategy?: Record<string, unknown>) {
    const monthlyBudget = Number(strategy?.monthlyBudget ?? 0);
    const postingFrequency = Number(strategy?.postingFrequency ?? 0);
    const viralThreshold = Number(strategy?.viralThreshold ?? process.env.VIRAL_SCORE_THRESHOLD ?? 65);

    return {
      ...(strategy ?? {}),
      monthlyBudget,
      postingFrequency,
      viralThreshold,
      budgetPerVideo:
        monthlyBudget > 0 && postingFrequency > 0
          ? Number((monthlyBudget / postingFrequency).toFixed(2))
          : 0,
    };
  },
};
