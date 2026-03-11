import { getDb } from "../db";

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
  channelCount?: number;
  totalViews?: number;
  avgCTR?: number;
  totalRevenue?: number;
}

export const nicheManagementService = {
  // Create a new niche
  async createNiche(
    userId: number,
    input: NicheInput
  ): Promise<{ id: number; success: boolean }> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await (db as any).execute(
        `INSERT INTO niches (userId, nicheName, description, category, targetAudience, performanceTargets, monetizationStrategy)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          input.nicheName,
          input.description || null,
          input.category || null,
          JSON.stringify(input.targetAudience || {}),
          JSON.stringify(input.performanceTargets || {}),
          JSON.stringify(input.monetizationStrategy || {}),
        ]
      );
      return { id: (result as any).insertId, success: true };
    } catch (error) {
      console.error("Error creating niche:", error);
      throw new Error("Failed to create niche");
    }
  },

  // Update niche
  async updateNiche(
    nicheId: number,
    updates: Partial<NicheInput>
  ): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const fields: string[] = [];
      const values: unknown[] = [];

      if (updates.nicheName) {
        fields.push("nicheName = ?");
        values.push(updates.nicheName);
      }
      if (updates.description) {
        fields.push("description = ?");
        values.push(updates.description);
      }
      if (updates.category) {
        fields.push("category = ?");
        values.push(updates.category);
      }
      if (updates.targetAudience) {
        fields.push("targetAudience = ?");
        values.push(JSON.stringify(updates.targetAudience));
      }
      if (updates.performanceTargets) {
        fields.push("performanceTargets = ?");
        values.push(JSON.stringify(updates.performanceTargets));
      }
      if (updates.monetizationStrategy) {
        fields.push("monetizationStrategy = ?");
        values.push(JSON.stringify(updates.monetizationStrategy));
      }

      if (fields.length === 0) return true;

      fields.push("updatedAt = NOW()");
      values.push(nicheId);

      await (db as any).query(
        `UPDATE niches SET ${fields.join(", ")} WHERE id = ?`,
        values
      );
      return true;
    } catch (error) {
      console.error("Error updating niche:", error);
      throw new Error("Failed to update niche");
    }
  },

  // Delete niche
  async deleteNiche(nicheId: number): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await (db as any).execute("DELETE FROM niches WHERE id = ?", [nicheId]); return true;
    } catch (error) {
      console.error("Error deleting niche:", error);
      throw new Error("Failed to delete niche");
    }
  },

  // Get single niche
  async getNiche(nicheId: number): Promise<NicheWithStats | null> {
    try {
      // Return mock data for now
      return null;
    } catch (error) {
      console.error("Error getting niche:", error);
      return null;
    }
  },

  // List all niches for user
  async listNiches(userId: number): Promise<NicheWithStats[]> {
    try {
      // Return mock data for now - database table not fully implemented
      return [];
    } catch (error) {
      console.error("Error listing niches:", error);
      return [];
    }
  },

  // Add channel to niche
  async addChannelToNiche(
    nicheId: number,
    youtubeChannelId: string,
    channelName: string
  ): Promise<{ id: number; success: boolean }> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await (db as any).execute(
        `INSERT INTO niche_channels (nicheId, youtubeChannelId, channelName)
         VALUES (?, ?, ?)`,
        [nicheId, youtubeChannelId, channelName]
      );
      return { id: (result as any).insertId, success: true };
    } catch (error) {
      console.error("Error adding channel to niche:", error);
      throw new Error("Failed to add channel to niche");
    }
  },

  // Get niche performance
  async getNichePerformance(
    nicheId: number,
    days: number = 30
  ): Promise<
    Array<{
      date: string;
      views: number;
      ctr: number;
      retention: number;
      revenue: number;
    }>
  > {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await (db as any).query(
        `SELECT DATE(timestamp) as date,
                SUM(views) as views,
                AVG(ctr) as ctr,
                AVG(retention) as retention,
                SUM(revenue) as revenue
         FROM niche_performance
         WHERE nicheId = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY DATE(timestamp)
         ORDER BY date DESC`,
        [nicheId, days]
      );
      return result as Array<{
        date: string;
        views: number;
        ctr: number;
        retention: number;
        revenue: number;
      }>;
    } catch (error) {
      console.error("Error getting niche performance:", error);
      throw new Error("Failed to get niche performance");
    }
  },

  // Get recommended hooks for niche
  async getRecommendedHooksForNiche(nicheId: number): Promise<string[]> {
    try {
      const niche = await this.getNiche(nicheId);
      if (!niche) return [];

      const hookTemplates = (niche as any).hookTemplates || {};
      return Object.values(hookTemplates).slice(0, 10) as string[];
    } catch (error) {
      console.error("Error getting recommended hooks:", error);
      throw new Error("Failed to get recommended hooks");
    }
  },

  // Get recommended thumbnail style for niche
  async getRecommendedThumbnailStyleForNiche(
    nicheId: number
  ): Promise<Record<string, unknown>> {
    try {
      const niche = await this.getNiche(nicheId);
      if (!niche) return {};

      return ((niche as any).thumbnailStyle || {}) as Record<string, unknown>;
    } catch (error) {
      console.error("Error getting thumbnail style:", error);
      throw new Error("Failed to get thumbnail style");
    }
  },

  // Auto-optimize video for niche
  async autoOptimizeForNiche(
    nicheId: number,
    videoData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    try {
      const niche = await this.getNiche(nicheId);
      if (!niche) return videoData;

      const optimized = {
        ...videoData,
        hooks: await this.getRecommendedHooksForNiche(nicheId),
        thumbnailStyle: await this.getRecommendedThumbnailStyleForNiche(
          nicheId
        ),
        targetAudience: (niche as any).targetAudience || {},
        performanceTargets: (niche as any).performanceTargets || {},
      };

      return optimized;
    } catch (error) {
      console.error("Error auto-optimizing for niche:", error);
      throw new Error("Failed to auto-optimize for niche");
    }
  },

  // Get niche trends
  async getNicheTrends(nicheId: number): Promise<
    Array<{
      topic: string;
      score: number;
      videoCount: number;
      avgViews: number;
    }>
  > {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await (db as any).query(
        `SELECT trendingTopic as topic, trendingScore as score, videoCount, avgViews
         FROM niche_trends
         WHERE nicheId = ?
         ORDER BY trendingScore DESC
         LIMIT 20`,
        [nicheId]
      );
      return result as Array<{
        topic: string;
        score: number;
        videoCount: number;
        avgViews: number;
      }>;
    } catch (error) {
      console.error("Error getting niche trends:", error);
      throw new Error("Failed to get niche trends");
    }
  },

  // Get niche audience profile
  async getNicheAudience(
    nicheId: number
  ): Promise<Record<string, unknown> | null> {
    try {
      const niche = await this.getNiche(nicheId);
      if (!niche) return null;

      return ((niche as any).targetAudience || {}) as Record<string, unknown>;
    } catch (error) {
      console.error("Error getting niche audience:", error);
      throw new Error("Failed to get niche audience");
    }
  },
};
