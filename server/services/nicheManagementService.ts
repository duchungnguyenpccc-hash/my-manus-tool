import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { nicheTopicQueue, niches } from "../../drizzle/schema";

export interface NicheInput {
  nicheName: string;
  description?: string;
  category?: string;
  targetAudience?: Record<string, unknown>;
  performanceTargets?: Record<string, unknown>;
  monetizationStrategy?: Record<string, unknown>;
}

export interface NicheWithStats extends NicheInput {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  queuedTopics?: number;
}

export const nicheManagementService = {
  async createNiche(userId: number, input: NicheInput): Promise<{ id: number; success: boolean }> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result: any = await db.insert(niches).values({
      userId,
      nicheName: input.nicheName,
      description: input.description || null,
      category: input.category || null,
      targetAudience: input.targetAudience || {},
      performanceTargets: input.performanceTargets || {},
      monetizationStrategy: input.monetizationStrategy || {},
    });

    return { id: Number(result?.[0]?.insertId ?? result?.insertId ?? 0), success: true };
  },

  async updateNiche(nicheId: number, updates: Partial<NicheInput>): Promise<boolean> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(niches)
      .set({
        nicheName: updates.nicheName,
        description: updates.description,
        category: updates.category,
        targetAudience: updates.targetAudience,
        performanceTargets: updates.performanceTargets,
        monetizationStrategy: updates.monetizationStrategy,
        updatedAt: new Date(),
      })
      .where(eq(niches.id, nicheId));

    return true;
  },

  async deleteNiche(nicheId: number): Promise<boolean> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(niches).where(eq(niches.id, nicheId));
    return true;
  },

  async getNiche(nicheId: number): Promise<NicheWithStats | null> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(niches).where(eq(niches.id, nicheId)).limit(1);
    return (result[0] as NicheWithStats) || null;
  },

  async listNiches(userId: number): Promise<NicheWithStats[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const nicheRows = await db.select().from(niches).where(eq(niches.userId, userId)).orderBy(desc(niches.createdAt));

    const queueRows = await db
      .select()
      .from(nicheTopicQueue)
      .where(and(eq(nicheTopicQueue.userId, userId), eq(nicheTopicQueue.status, "queued")));

    const queueByNiche = new Map<number, number>();
    for (const q of queueRows) {
      queueByNiche.set(q.nicheId, (queueByNiche.get(q.nicheId) || 0) + 1);
    }

    return nicheRows.map((n) => ({ ...(n as NicheWithStats), queuedTopics: queueByNiche.get(n.id) || 0 }));
  },

  async addChannelToNiche(_nicheId: number, _youtubeChannelId: string, _channelName: string): Promise<{ id: number; success: boolean }> {
    return { id: 0, success: true };
  },

  async getNichePerformance(_nicheId: number, _days: number = 30): Promise<Array<{ date: string; views: number; ctr: number; retention: number; revenue: number }>> {
    return [];
  },

  async getRecommendedHooksForNiche(nicheId: number): Promise<string[]> {
    const niche = await this.getNiche(nicheId);
    if (!niche) return [];
    const base = niche.category || niche.nicheName;
    return [`${base}: Bí mật ít ai biết`, `${base}: Sai lầm phổ biến cần tránh`, `${base}: 3 bước để bắt đầu`];
  },

  async getRecommendedThumbnailStyleForNiche(nicheId: number): Promise<Record<string, unknown>> {
    const niche = await this.getNiche(nicheId);
    if (!niche) return {};
    return { colorPalette: "high-contrast", textDensity: "medium", niche: niche.nicheName };
  },

  async autoOptimizeForNiche(nicheId: number, videoData: Record<string, unknown>): Promise<Record<string, unknown>> {
    const niche = await this.getNiche(nicheId);
    if (!niche) return videoData;

    return {
      ...videoData,
      nicheId,
      hooks: await this.getRecommendedHooksForNiche(nicheId),
      thumbnailStyle: await this.getRecommendedThumbnailStyleForNiche(nicheId),
      targetAudience: niche.targetAudience || {},
      performanceTargets: niche.performanceTargets || {},
    };
  },

  async getNicheTrends(_nicheId: number): Promise<Array<{ topic: string; score: number; videoCount: number; avgViews: number }>> {
    return [];
  },

  async getNicheAudience(nicheId: number): Promise<Record<string, unknown> | null> {
    const niche = await this.getNiche(nicheId);
    if (!niche) return null;
    return (niche.targetAudience || {}) as Record<string, unknown>;
  },

  async enqueueTopic(userId: number, nicheId: number, topic: string, priority = 100, source = "manual") {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result: any = await db.insert(nicheTopicQueue).values({
      userId,
      nicheId,
      topic,
      priority,
      source,
      status: "queued",
    });

    return { id: Number(result?.[0]?.insertId ?? result?.insertId ?? 0), success: true };
  },

  async listTopicQueue(userId: number, nicheId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db
      .select()
      .from(nicheTopicQueue)
      .where(and(eq(nicheTopicQueue.userId, userId), eq(nicheTopicQueue.nicheId, nicheId)))
      .orderBy(asc(nicheTopicQueue.priority), asc(nicheTopicQueue.createdAt));
  },

  async updateTopicPriority(userId: number, topicQueueId: number, priority: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(nicheTopicQueue)
      .set({ priority, updatedAt: new Date() })
      .where(and(eq(nicheTopicQueue.id, topicQueueId), eq(nicheTopicQueue.userId, userId)));

    return { success: true };
  },

  async updateTopicStatus(
    userId: number,
    topicQueueId: number,
    status: "queued" | "claimed" | "completed" | "failed" | "cancelled"
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(nicheTopicQueue)
      .set({
        status,
        updatedAt: new Date(),
        completedAt: status === "completed" || status === "cancelled" ? new Date() : null,
      })
      .where(and(eq(nicheTopicQueue.id, topicQueueId), eq(nicheTopicQueue.userId, userId)));

    return { success: true };
  },
};
