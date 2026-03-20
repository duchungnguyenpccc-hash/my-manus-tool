import { desc, eq } from "drizzle-orm";
import { campaigns } from "../../drizzle/schema";
import { getDb } from "../db";
import { batchProductionService } from "./batchProductionService";
import { objectiveEngine } from "./objectiveEngine";
import { topicMiningService } from "./topicMiningService";

let started = false;

export const autonomousGrowthService = {
  async runCycle() {
    const db = await getDb();
    if (!db) return { processed: 0, launched: 0, rebalancedUsers: 0 };

    const activeCampaigns = await db.select().from(campaigns).where(eq(campaigns.status, "active")).orderBy(desc(campaigns.updatedAt)).limit(20);
    const userIds = Array.from(new Set(activeCampaigns.map((campaign) => campaign.userId)));
    for (const userId of userIds) {
      await objectiveEngine.rebalancePortfolio(userId);
    }

    const launchedCampaigns = activeCampaigns
      .map(async (campaign) => {
        const profile = await objectiveEngine.getProfile(campaign.userId, campaign.nicheId);
        if (!profile.autonomousMode || profile.budgetPolicy.nichePriority < 0.75) return false;

        await topicMiningService.mineAndQueueTopics({
          nicheId: campaign.nicheId,
          userId: campaign.userId,
          limit: Math.max(10, Math.min(30, profile.productionPolicy.replicationCount)),
          boostPriority: Math.round((1 - profile.productionPolicy.explorationRate) * 20 + profile.budgetPolicy.nichePriority * 5),
          source: "autonomous_mode",
        });

        await batchProductionService.createBatch({
          userId: campaign.userId,
          nicheId: campaign.nicheId,
          numberOfVideos: Math.max(1, Math.round(profile.productionPolicy.videosPerDay * profile.budgetPolicy.nichePriority)),
        });
        return true;
      });

    const launched = (await Promise.all(launchedCampaigns)).filter(Boolean).length;
    return { processed: activeCampaigns.length, launched, rebalancedUsers: userIds.length };
  },

  start() {
    if (started) return;
    started = true;
    const intervalMs = Number(process.env.AUTONOMOUS_MODE_INTERVAL_MS ?? 5 * 60 * 1000);

    setInterval(() => {
      void this.runCycle().catch((error) => {
        console.error("[Autonomous Growth] cycle failed", error);
      });
    }, intervalMs);

    void this.runCycle().catch((error) => {
      console.error("[Autonomous Growth] bootstrap failed", error);
    });
  },
};
