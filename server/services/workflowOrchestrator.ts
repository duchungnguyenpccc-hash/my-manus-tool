/**
 * Workflow Orchestrator
 * Manages the video generation pipeline with task queuing and progress tracking
 */

import { getDb } from "../db";
import { workflowTasks, videoProjects, generatedAssets } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export type TaskType = "script" | "image" | "video" | "audio" | "render" | "upload";
export type TaskStatus = "pending" | "processing" | "completed" | "failed" | "skipped";

export interface WorkflowStep {
  taskType: TaskType;
  input: Record<string, any>;
  retryCount?: number;
  maxRetries?: number;
}

export interface WorkflowProgress {
  projectId: number;
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  status: "idle" | "running" | "paused" | "completed" | "failed";
  progress: number; // 0-100
  currentTask?: {
    taskId: number;
    type: TaskType;
    status: TaskStatus;
    progress?: number;
  };
}

/**
 * Create workflow tasks for a video project
 */
export async function createWorkflowTasks(
  projectId: number,
  steps: WorkflowStep[]
): Promise<number[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const taskIds: number[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const result = await db.insert(workflowTasks).values({
      projectId,
      taskType: step.taskType,
      status: "pending",
      input: step.input,
      retryCount: 0,
      maxRetries: step.maxRetries || 3,
    });

    // Get the inserted task ID
    const tasks = await db
      .select()
      .from(workflowTasks)
      .where(and(eq(workflowTasks.projectId, projectId), eq(workflowTasks.taskType, step.taskType)))
      .orderBy((t) => t.createdAt)
      .limit(1);

    if (tasks.length > 0) {
      taskIds.push(tasks[0].id);
    }
  }

  return taskIds;
}

/**
 * Get next pending task
 */
export async function getNextPendingTask(projectId: number): Promise<any | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const tasks = await db
    .select()
    .from(workflowTasks)
    .where(and(eq(workflowTasks.projectId, projectId), eq(workflowTasks.status, "pending")))
    .orderBy((t) => t.createdAt)
    .limit(1);

  return tasks.length > 0 ? tasks[0] : null;
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: number,
  status: TaskStatus,
  output?: Record<string, any>,
  error?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updates: Record<string, any> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "processing") {
    updates.startedAt = new Date();
  } else if (status === "completed" || status === "failed") {
    updates.completedAt = new Date();
  }

  if (output) {
    updates.output = output;
  }

  if (error) {
    updates.error = error;
  }

  const result = await db
    .update(workflowTasks)
    .set(updates)
    .where(eq(workflowTasks.id, taskId));

  return true;
}

/**
 * Increment task retry count
 */
export async function incrementRetryCount(taskId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const task = await db.select().from(workflowTasks).where(eq(workflowTasks.id, taskId)).limit(1);

  if (task.length === 0) {
    throw new Error("Task not found");
  }

  const currentRetry = task[0].retryCount || 0;
  const maxRetries = task[0].maxRetries || 3;

  if (currentRetry >= maxRetries) {
    await updateTaskStatus(taskId, "failed", undefined, `Max retries (${maxRetries}) exceeded`);
    return false;
  }

  await db
    .update(workflowTasks)
    .set({
      retryCount: currentRetry + 1,
      updatedAt: new Date(),
    })
    .where(eq(workflowTasks.id, taskId));

  return true;
}

/**
 * Get workflow progress
 */
export async function getWorkflowProgress(projectId: number): Promise<WorkflowProgress> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const tasks = await db
    .select()
    .from(workflowTasks)
    .where(eq(workflowTasks.projectId, projectId))
    .orderBy((t) => t.createdAt);

  const totalSteps = tasks.length;
  const completedSteps = tasks.filter((t) => t.status === "completed").length;
  const failedSteps = tasks.filter((t) => t.status === "failed").length;
  const processingTask = tasks.find((t) => t.status === "processing");

  let status: "idle" | "running" | "paused" | "completed" | "failed" = "idle";
  if (processingTask) {
    status = "running";
  } else if (failedSteps > 0) {
    status = "failed";
  } else if (completedSteps === totalSteps && totalSteps > 0) {
    status = "completed";
  }

  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return {
    projectId,
    currentStep: tasks.findIndex((t) => t.status === "pending" || t.status === "processing") + 1,
    totalSteps,
    completedSteps,
    failedSteps,
    status,
    progress,
    currentTask: processingTask
      ? {
          taskId: processingTask.id,
          type: processingTask.taskType as TaskType,
          status: processingTask.status as TaskStatus,
        }
      : undefined,
  };
}

/**
 * Get all tasks for a project
 */
export async function getProjectTasks(projectId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db
    .select()
    .from(workflowTasks)
    .where(eq(workflowTasks.projectId, projectId))
    .orderBy((t) => t.createdAt);
}

/**
 * Get task details
 */
export async function getTaskDetails(taskId: number): Promise<any | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const tasks = await db.select().from(workflowTasks).where(eq(workflowTasks.id, taskId)).limit(1);

  return tasks.length > 0 ? tasks[0] : null;
}

/**
 * Retry failed task
 */
export async function retryFailedTask(taskId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const task = await db.select().from(workflowTasks).where(eq(workflowTasks.id, taskId)).limit(1);

  if (task.length === 0) {
    throw new Error("Task not found");
  }

  if (task[0].status !== "failed") {
    throw new Error("Only failed tasks can be retried");
  }

  await db
    .update(workflowTasks)
    .set({
      status: "pending",
      error: null,
      retryCount: 0,
      updatedAt: new Date(),
    })
    .where(eq(workflowTasks.id, taskId));

  return true;
}

/**
 * Skip a task
 */
export async function skipTask(taskId: number, reason?: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(workflowTasks)
    .set({
      status: "skipped",
      error: reason,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(workflowTasks.id, taskId));

  return true;
}

/**
 * Cancel all pending tasks for a project
 */
export async function cancelProjectTasks(projectId: number, reason?: string): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const tasks = await db
    .select()
    .from(workflowTasks)
    .where(and(eq(workflowTasks.projectId, projectId), eq(workflowTasks.status, "pending")));

  for (const task of tasks) {
    await skipTask(task.id, reason || "Project cancelled");
  }

  return tasks.length;
}

/**
 * Get workflow statistics
 */
export async function getWorkflowStats(projectId: number): Promise<any> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const tasks = await db
    .select()
    .from(workflowTasks)
    .where(eq(workflowTasks.projectId, projectId));

  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === "completed").length,
    failedTasks: tasks.filter((t) => t.status === "failed").length,
    skippedTasks: tasks.filter((t) => t.status === "skipped").length,
    pendingTasks: tasks.filter((t) => t.status === "pending").length,
    processingTasks: tasks.filter((t) => t.status === "processing").length,
    totalRetries: tasks.reduce((sum, t) => sum + (t.retryCount || 0), 0),
    averageRetries: tasks.length > 0 ? tasks.reduce((sum, t) => sum + (t.retryCount || 0), 0) / tasks.length : 0,
    tasksByType: {
      script: tasks.filter((t) => t.taskType === "script").length,
      image: tasks.filter((t) => t.taskType === "image").length,
      video: tasks.filter((t) => t.taskType === "video").length,
      audio: tasks.filter((t) => t.taskType === "audio").length,
      render: tasks.filter((t) => t.taskType === "render").length,
      upload: tasks.filter((t) => t.taskType === "upload").length,
    },
  };

  return stats;
}
