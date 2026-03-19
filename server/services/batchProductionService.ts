import { desc, eq, and } from "drizzle-orm";
import { nicheTopicQueue, videoProjects } from "../../drizzle/schema";
import { getDb } from "../db";
import { enqueueWorkflowJob, getWorkflowQueueStats } from "./workflowDispatchService";
import { topicRapidGenerator } from "./topicRapidGenerator";
import { decisionEngine } from "./decisionEngine";

type Variant = "short" | "long";

function getVariantConfig(variant: Variant) {
  return variant === "short"
    ? { videoDuration: 45, sceneCount: 4, label: "SHORT" }
    : { videoDuration: 480, sceneCount: 8, label: "LONG" };
}

async function createQueuedProject(params: {
  userId: number;
  nicheId: number;
  topic: string;
  variant: Variant;
  topicQueueId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const variantConfig = getVariantConfig(params.variant);
  const insertResult: any = await db.insert(videoProjects).values({
    userId: params.userId,
    title: `${params.topic} (${variantConfig.label})`.slice(0, 255),
    topic: params.topic,
    status: "processing",
    config: {
      nicheId: params.nicheId,
      sceneCount: variantConfig.sceneCount,
      videoDuration: variantConfig.videoDuration,
      voicePreset: "alloy",
      autoPublish: false,
      strategyVariant: params.variant,
      costMode: "auto",
    },
  });

  const projectId = Number(insertResult?.[0]?.insertId ?? insertResult?.insertId ?? 0);
  const jobId = await enqueueWorkflowJob({
    projectId,
    userId: params.userId,
    nicheId: params.nicheId,
    topicQueueId: params.topicQueueId,
    payload: {
      topic: params.topic,
      variant: params.variant,
      sceneCount: variantConfig.sceneCount,
      duration: variantConfig.videoDuration,
      costMode: "auto",
    },
  });

  return { projectId, jobId, variant: params.variant, topic: params.topic };
}

export const batchProductionService = {
  async createBatch(input: { userId: number; nicheId: number; numberOfVideos: number }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const desired = Math.max(1, Math.min(50, input.numberOfVideos));
    let queuedTopics = await db
      .select()
      .from(nicheTopicQueue)
      .where(and(eq(nicheTopicQueue.userId, input.userId), eq(nicheTopicQueue.nicheId, input.nicheId), eq(nicheTopicQueue.status, "queued")))
      .orderBy(desc(nicheTopicQueue.createdAt))
      .limit(100);

    if (queuedTopics.length < desired) {
      const rapid = await topicRapidGenerator.generateRapidTopics({ nicheId: input.nicheId, userId: input.userId, count: 100 });
      if (rapid.selectedTopics.length > 0) {
        await db.insert(nicheTopicQueue).values(
          rapid.selectedTopics.map((topic) => ({
            nicheId: input.nicheId,
            userId: input.userId,
            topic: topic.topic,
            priority: Math.max(1, 101 - topic.viralProbability),
            source: "rapid_generator" as const,
            status: "queued" as const,
          }))
        );
      }
      queuedTopics = await db
        .select()
        .from(nicheTopicQueue)
        .where(and(eq(nicheTopicQueue.userId, input.userId), eq(nicheTopicQueue.nicheId, input.nicheId), eq(nicheTopicQueue.status, "queued")))
        .orderBy(desc(nicheTopicQueue.createdAt))
        .limit(100);
    }

    const ranked = await decisionEngine.rankAndGateTopics({
      userId: input.userId,
      nicheId: input.nicheId,
      topics: queuedTopics.map((item) => ({ topic: item.topic })),
    });

    const winners = ranked.selected.slice(0, Math.max(1, Math.ceil(desired / 2)));
    const created: Array<{ projectId: number; jobId: number; variant: Variant; topic: string }> = [];
    for (const winner of winners) {
      const queueItem = queuedTopics.find((item) => item.topic === winner.topic);
      if (created.length < desired) {
        created.push(await createQueuedProject({ userId: input.userId, nicheId: input.nicheId, topic: winner.topic, variant: "short", topicQueueId: queueItem?.id }));
      }
      if (created.length < desired) {
        created.push(await createQueuedProject({ userId: input.userId, nicheId: input.nicheId, topic: winner.topic, variant: "long", topicQueueId: queueItem?.id }));
      }
    }

    return {
      requestedVideos: desired,
      createdCount: created.length,
      created,
      queue: await getWorkflowQueueStats(),
    };
  },
};
