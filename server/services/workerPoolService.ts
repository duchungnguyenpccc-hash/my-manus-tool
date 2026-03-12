import { and, eq } from "drizzle-orm";
import { createHash } from "crypto";
import { jobIdempotencyKeys } from "../../drizzle/schema";
import { getDb } from "../db";
import { withRetry } from "./resilience";

export type WorkerType = "research" | "script" | "media" | "render" | "upload";

const hashPayload = (payload: unknown) =>
  createHash("sha256").update(JSON.stringify(payload)).digest("hex");

export async function runIdempotentWorkerJob<T>(params: {
  key: string;
  workerType: WorkerType;
  payload: unknown;
  job: () => Promise<T>;
  maxAttempts?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(jobIdempotencyKeys)
    .where(eq(jobIdempotencyKeys.key, params.key))
    .limit(1);

  if (existing[0]?.status === "completed") {
    return { skipped: true as const, reason: "already_completed" };
  }

  if (!existing.length) {
    await db.insert(jobIdempotencyKeys).values({
      key: params.key,
      workerType: params.workerType,
      status: "processing",
      payloadHash: hashPayload(params.payload),
    });
  }

  try {
    const result = await withRetry(params.job, {
      operationName: `worker:${params.workerType}`,
      maxAttempts: params.maxAttempts ?? 3,
      timeoutMs: 120000,
    });

    await db
      .update(jobIdempotencyKeys)
      .set({ status: "completed", updatedAt: new Date(), lastError: null })
      .where(eq(jobIdempotencyKeys.key, params.key));

    return { skipped: false as const, result };
  } catch (error) {
    await db
      .update(jobIdempotencyKeys)
      .set({
        status: "failed",
        lastError: error instanceof Error ? error.message : String(error),
        updatedAt: new Date(),
      })
      .where(and(eq(jobIdempotencyKeys.key, params.key), eq(jobIdempotencyKeys.workerType, params.workerType)));
    throw error;
  }
}
