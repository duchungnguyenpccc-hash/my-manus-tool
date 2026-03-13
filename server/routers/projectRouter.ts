import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { nicheTopicQueue, videoProjects, workflowTasks } from "../../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { enqueueWorkflowJob, getWorkflowQueueStats } from "../services/workflowDispatchService";
import { scriptVersioningService } from "../services/scriptVersioningService";
import { simulateViralPotential } from "../services/youtubeAlgorithmSimulatorService";

const VIRAL_THRESHOLD = Number(process.env.VIRAL_SCORE_THRESHOLD ?? 65);

async function assertViralGate(topic: string) {
  const prediction = await simulateViralPotential({ topic, title: topic, threshold: VIRAL_THRESHOLD });
  if (prediction.decision !== "allow") {
    throw new Error(
      `Video bị chặn: viral score ${prediction.viralScore}/100 thấp hơn ngưỡng ${prediction.threshold}/100`
    );
  }
  return prediction;
}

async function createProjectAndQueue(params: {
  userId: number;
  topic: string;
  sceneCount: number;
  videoDuration: number;
  voicePreset: string;
  autoPublish: boolean;
  nicheId?: number;
  topicQueueId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const insertResult: any = await db.insert(videoProjects).values({
    userId: params.userId,
    title: params.topic.slice(0, 255),
    topic: params.topic,
    status: "processing",
    config: {
      sceneCount: params.sceneCount,
      videoDuration: params.videoDuration,
      voicePreset: params.voicePreset,
      autoPublish: params.autoPublish,
      nicheId: params.nicheId,
      topicQueueId: params.topicQueueId,
    },
  });

  let projectId = Number(insertResult?.[0]?.insertId ?? insertResult?.insertId ?? 0);
  if (!projectId) {
    const fallback = await db
      .select()
      .from(videoProjects)
      .where(and(eq(videoProjects.userId, params.userId), eq(videoProjects.topic, params.topic)))
      .orderBy(desc(videoProjects.createdAt))
      .limit(1);
    projectId = fallback[0]?.id ?? 0;
  }

  if (!projectId) throw new Error("Failed to create project record");

  const jobId = await enqueueWorkflowJob({
    projectId,
    userId: params.userId,
    nicheId: params.nicheId,
    topicQueueId: params.topicQueueId,
    payload: {
      topic: params.topic,
      sceneCount: params.sceneCount,
      duration: params.videoDuration,
      voiceId: params.voicePreset,
    },
  });

  if (params.topicQueueId) {
    await db
      .update(nicheTopicQueue)
      .set({ status: "claimed", projectId, claimedAt: new Date(), updatedAt: new Date() })
      .where(eq(nicheTopicQueue.id, params.topicQueueId));
  }

  return {
    success: true,
    projectId,
    jobId,
    status: "queued",
    queue: await getWorkflowQueueStats(),
    message: "Project created and workflow queued",
    error: undefined as string | undefined,
  };
}

export const projectRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(10).max(1000),
        sceneCount: z.number().int().min(1).max(20),
        videoDuration: z.number().int().min(30).max(600),
        voicePreset: z.string(),
        autoPublish: z.boolean().default(false),
        googleSheetsUrl: z.string().optional(),
        nicheId: z.number().optional(),
        topicQueueId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertViralGate(input.topic);
      return createProjectAndQueue({
        userId: ctx.user.id,
        topic: input.topic,
        sceneCount: input.sceneCount,
        videoDuration: input.videoDuration,
        voicePreset: input.voicePreset,
        autoPublish: input.autoPublish,
        nicheId: input.nicheId,
        topicQueueId: input.topicQueueId,
      });
    }),

  createFromNicheQueue: protectedProcedure
    .input(
      z.object({
        nicheId: z.number(),
        sceneCount: z.number().int().min(1).max(20).default(5),
        videoDuration: z.number().int().min(30).max(600).default(60),
        voicePreset: z.string().default("alloy"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const queuedTopics = await db
        .select()
        .from(nicheTopicQueue)
        .where(
          and(
            eq(nicheTopicQueue.nicheId, input.nicheId),
            eq(nicheTopicQueue.userId, ctx.user.id),
            eq(nicheTopicQueue.status, "queued")
          )
        )
        .orderBy(asc(nicheTopicQueue.priority), asc(nicheTopicQueue.createdAt))
        .limit(20);

      let topicItem = queuedTopics[0];
      if (!topicItem) throw new Error("No queued topics available for this niche");

      // Only allow high viral score topics into production pipeline.
      const scored = [] as Array<{ id: number; score: number; topic: string }>;
      for (const item of queuedTopics) {
        const prediction = await simulateViralPotential({ topic: item.topic, title: item.topic, threshold: VIRAL_THRESHOLD });
        scored.push({ id: item.id, score: prediction.viralScore, topic: item.topic });
      }
      scored.sort((a, b) => b.score - a.score);
      const best = scored.find((s) => s.score >= VIRAL_THRESHOLD);
      if (!best) {
        throw new Error(`Không có topic nào đạt viral threshold ${VIRAL_THRESHOLD}`);
      }
      topicItem = queuedTopics.find((q) => q.id === best.id)!;

      return createProjectAndQueue({
        userId: ctx.user.id,
        topic: topicItem.topic,
        sceneCount: input.sceneCount,
        videoDuration: input.videoDuration,
        voicePreset: input.voicePreset,
        autoPublish: false,
        nicheId: input.nicheId,
        topicQueueId: topicItem.id,
      });
    }),


  autoCreateFromQueue: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(5),
        nicheId: z.number().optional(),
        sceneCount: z.number().int().min(1).max(20).default(5),
        videoDuration: z.number().int().min(30).max(600).default(60),
        voicePreset: z.string().default("alloy"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allQueued = await db
        .select()
        .from(nicheTopicQueue)
        .where(and(eq(nicheTopicQueue.userId, ctx.user.id), eq(nicheTopicQueue.status, "queued")))
        .orderBy(asc(nicheTopicQueue.priority), asc(nicheTopicQueue.createdAt));

      const filtered = input.nicheId
        ? allQueued.filter((q) => q.nicheId === input.nicheId)
        : allQueued;

      const rows = filtered.slice(0, input.limit);
      const created = [] as Array<{ topicQueueId: number; projectId: number; jobId: number }>;
      for (const row of rows) {
        const prediction = await simulateViralPotential({ topic: row.topic, title: row.topic, threshold: VIRAL_THRESHOLD });
        if (prediction.decision !== "allow") {
          continue;
        }
        const result = await createProjectAndQueue({
          userId: ctx.user.id,
          topic: row.topic,
          sceneCount: input.sceneCount,
          videoDuration: input.videoDuration,
          voicePreset: input.voicePreset,
          autoPublish: false,
          nicheId: row.nicheId,
          topicQueueId: row.id,
        });

        created.push({ topicQueueId: row.id, projectId: result.projectId, jobId: result.jobId });
      }

      return {
        success: true,
        createdCount: created.length,
        created,
      };
    }),

  getById: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const project = await db.select().from(videoProjects).where(and(eq(videoProjects.id, input.projectId), eq(videoProjects.userId, ctx.user.id))).limit(1);
    if (!project.length) throw new Error("Project not found");

    const tasks = await db.select().from(workflowTasks).where(eq(workflowTasks.projectId, input.projectId));
    return { project: project[0], tasks };
  }),

  list: protectedProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(videoProjects).where(eq(videoProjects.userId, ctx.user.id)).orderBy(desc(videoProjects.createdAt)).limit(input.limit).offset(input.offset);
    }),

  getProgress: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const project = await db.select().from(videoProjects).where(and(eq(videoProjects.id, input.projectId), eq(videoProjects.userId, ctx.user.id))).limit(1);
    if (!project.length) throw new Error("Project not found");

    const tasks = await db.select().from(workflowTasks).where(eq(workflowTasks.projectId, input.projectId));
    const totalSteps = 10;
    const completedSteps = tasks.filter((t) => t.status === "completed").length;
    const failedSteps = tasks.filter((t) => t.status === "failed").length;

    return {
      projectId: input.projectId,
      status: project[0].status,
      progress: Math.round((completedSteps / totalSteps) * 100),
      totalSteps,
      completedSteps,
      failedSteps,
      tasks: tasks.map((t) => ({
        stepNumber: t.input ? (t.input as any).stepNumber : 0,
        stepName: t.input ? (t.input as any).stepName : "Unknown",
        status: t.status,
        error: t.error,
        startedAt: t.startedAt,
        completedAt: t.completedAt,
      })),
    };
  }),

  getScriptVersions: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      return scriptVersioningService.listByProject(input.projectId, ctx.user.id);
    }),

  delete: protectedProcedure.input(z.object({ projectId: z.number() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const project = await db.select().from(videoProjects).where(and(eq(videoProjects.id, input.projectId), eq(videoProjects.userId, ctx.user.id))).limit(1);
    if (!project.length) throw new Error("Project not found");

    await db.update(videoProjects).set({ status: "archived" }).where(eq(videoProjects.id, input.projectId));
    return { success: true, message: "Project archived" };
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const projects = await db.select().from(videoProjects).where(eq(videoProjects.userId, ctx.user.id));
    return {
      totalProjects: projects.length,
      completedProjects: projects.filter((p) => p.status === "completed").length,
      processingProjects: projects.filter((p) => p.status === "processing").length,
      failedProjects: projects.filter((p) => p.status === "failed").length,
      archivedProjects: projects.filter((p) => p.status === "archived").length,
    };
  }),
});
