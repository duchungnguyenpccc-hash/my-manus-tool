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
      strategy: params.strategy ?? {},
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

    return rows;
  },
};
