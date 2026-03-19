import { and, asc, eq, lte } from "drizzle-orm";
import { getDb } from "../db";
import { nicheTopicQueue, workflowJobs } from "../../drizzle/schema";
import { executeCompleteWorkflow, type WorkflowConfig } from "./improvedWorkflowOrchestrator";

export interface WorkflowJobPayload {
  topic: string;
  sceneCount: number;
  duration: number;
  voiceId?: string;
  imageModel?: "flux" | "qwen";
  videoModel?: "veo3" | "kling";
}

export async function enqueueWorkflowJob(input: {
  userId: number;
  projectId: number;
  nicheId?: number;
  topicQueueId?: number;
  payload: WorkflowJobPayload;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result: any = await db.insert(workflowJobs).values({
    userId: input.userId,
    projectId: input.projectId,
    nicheId: input.nicheId,
    topicQueueId: input.topicQueueId,
    payload: input.payload,
    status: "queued",
    attempts: 0,
    maxAttempts: 3,
  });

  return Number(result?.[0]?.insertId ?? result?.insertId ?? 0);
}

export async function getWorkflowQueueStats() {
  const db = await getDb();
  if (!db) {
    return { queued: 0, processing: 0, completed: 0, failed: 0 };
  }

  const jobs = await db.select().from(workflowJobs);

  return {
    queued: jobs.filter((j) => j.status === "queued").length,
    processing: jobs.filter((j) => j.status === "processing").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed: jobs.filter((j) => j.status === "failed").length,
  };
}

async function claimNextJob() {
  const db = await getDb();
  if (!db) return null;

  const jobs = await db
    .select()
    .from(workflowJobs)
    .where(and(eq(workflowJobs.status, "queued"), lte(workflowJobs.availableAt, new Date())))
    .orderBy(asc(workflowJobs.createdAt))
    .limit(1);

  const job = jobs[0];
  if (!job) return null;

  await db
    .update(workflowJobs)
    .set({
      status: "processing",
      attempts: (job.attempts || 0) + 1,
      lockedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(workflowJobs.id, job.id), eq(workflowJobs.status, "queued")));

  const claimed = await db.select().from(workflowJobs).where(eq(workflowJobs.id, job.id)).limit(1);
  if (!claimed[0] || claimed[0].status !== "processing") return null;
  return claimed[0];
}

async function completeJob(jobId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(workflowJobs)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
      error: null,
    })
    .where(eq(workflowJobs.id, jobId));
}

async function failJob(jobId: number, attempts: number, maxAttempts: number, error: unknown) {
  const db = await getDb();
  if (!db) return;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const shouldRetry = attempts < maxAttempts;

  await db
    .update(workflowJobs)
    .set({
      status: shouldRetry ? "queued" : "failed",
      availableAt: shouldRetry ? new Date(Date.now() + Math.min(30000, Math.pow(2, attempts) * 1000)) : new Date(),
      error: errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(workflowJobs.id, jobId));
}

let isWorkerStarted = false;

export function startWorkflowWorker() {
  if (isWorkerStarted) return;
  isWorkerStarted = true;

  const pollMs = Number(process.env.WORKFLOW_WORKER_POLL_MS || 2000);
  const concurrency = Number(process.env.WORKFLOW_MAX_CONCURRENCY || 2);
  let active = 0;

  const tick = async () => {
    while (active < concurrency) {
      const job = await claimNextJob();
      if (!job) break;

      active += 1;
      void (async () => {
        try {
          const payload = job.payload as WorkflowConfig;
          const result = await executeCompleteWorkflow(job.projectId, job.userId, payload);

          if (!result.success) {
            throw new Error(result.error || "Workflow failed");
          }

          await completeJob(job.id);

          if (job.topicQueueId) {
            const db = await getDb();
            if (db) {
              await db
                .update(nicheTopicQueue)
                .set({ status: "completed", projectId: job.projectId, completedAt: new Date(), updatedAt: new Date() })
                .where(eq(nicheTopicQueue.id, job.topicQueueId));
            }
          }
        } catch (error) {
          await failJob(job.id, job.attempts, job.maxAttempts, error);
          if (job.topicQueueId) {
            const db = await getDb();
            if (db && job.attempts >= job.maxAttempts) {
              await db
                .update(nicheTopicQueue)
                .set({ status: "failed", error: error instanceof Error ? error.message : String(error), updatedAt: new Date() })
                .where(eq(nicheTopicQueue.id, job.topicQueueId));
            }
          }
        } finally {
          active -= 1;
        }
      })();
    }
  };

  setInterval(() => {
    void tick();
  }, pollMs);

  void tick();
}
