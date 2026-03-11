import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createWorkflowTasks,
  getNextPendingTask,
  updateTaskStatus,
  getWorkflowProgress,
  getProjectTasks,
  getTaskDetails,
  retryFailedTask,
  skipTask,
  cancelProjectTasks,
  getWorkflowStats,
  type WorkflowStep,
} from "../services/workflowOrchestrator";
import { getDb } from "../db";
import { videoProjects } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const workflowRouter = router({
  /**
   * Create workflow tasks for a project
   */
  createTasks: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int(),
        steps: z.array(
          z.object({
            taskType: z.enum(["script", "image", "video", "audio", "render", "upload"]),
            input: z.record(z.string(), z.any()),
            maxRetries: z.number().int().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Verify project ownership
        const project = await db
          .select()
          .from(videoProjects)
          .where(eq(videoProjects.id, input.projectId))
          .limit(1);

        if (project.length === 0 || project[0].userId !== ctx.user.id) {
          throw new Error("Project not found or unauthorized");
        }

        const steps: WorkflowStep[] = input.steps.map((s) => ({
          taskType: s.taskType,
          input: s.input,
          maxRetries: s.maxRetries,
        }));

        // Update project status to processing
        await db
          .update(videoProjects)
          .set({
            status: "processing",
            updatedAt: new Date(),
          })
          .where(eq(videoProjects.id, input.projectId));

        const taskIds = await createWorkflowTasks(input.projectId, steps);

        return {
          success: true,
          taskIds,
          message: `Created ${taskIds.length} workflow tasks`,
        };
      } catch (error) {
        console.error("[Workflow] Error creating tasks:", error);
        throw new Error(`Failed to create tasks: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Get next pending task
   */
  getNextTask: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Verify project ownership
        const project = await db
          .select()
          .from(videoProjects)
          .where(eq(videoProjects.id, input.projectId))
          .limit(1);

        if (project.length === 0 || project[0].userId !== ctx.user.id) {
          throw new Error("Project not found or unauthorized");
        }

        const task = await getNextPendingTask(input.projectId);

        // Mark task as processing if found
        if (task) {
          await updateTaskStatus(task.id, "processing");
        }

        return {
          success: true,
          task,
        };
      } catch (error) {
        console.error("[Workflow] Error getting next task:", error);
        throw new Error(`Failed to get next task: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Update task status
   */
  updateTaskStatus: protectedProcedure
    .input(
      z.object({
        taskId: z.number().int(),
        status: z.enum(["pending", "processing", "completed", "failed", "skipped"]),
        output: z.record(z.string(), z.any()).optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await updateTaskStatus(input.taskId, input.status, input.output, input.error);

        return {
          success,
          message: `Task status updated to ${input.status}`,
        };
      } catch (error) {
        console.error("[Workflow] Error updating task status:", error);
        throw new Error(`Failed to update task status: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Get workflow progress
   */
  getProgress: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Verify project ownership
        const project = await db
          .select()
          .from(videoProjects)
          .where(eq(videoProjects.id, input.projectId))
          .limit(1);

        if (project.length === 0 || project[0].userId !== ctx.user.id) {
          throw new Error("Project not found or unauthorized");
        }

        const progress = await getWorkflowProgress(input.projectId);

        return {
          success: true,
          progress,
        };
      } catch (error) {
        console.error("[Workflow] Error getting progress:", error);
        throw new Error(`Failed to get progress: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Get all tasks for a project
   */
  getTasks: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Verify project ownership
        const project = await db
          .select()
          .from(videoProjects)
          .where(eq(videoProjects.id, input.projectId))
          .limit(1);

        if (project.length === 0 || project[0].userId !== ctx.user.id) {
          throw new Error("Project not found or unauthorized");
        }

        const tasks = await getProjectTasks(input.projectId);

        return {
          success: true,
          tasks,
        };
      } catch (error) {
        console.error("[Workflow] Error getting tasks:", error);
        throw new Error(`Failed to get tasks: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Get task details
   */
  getTaskDetails: protectedProcedure
    .input(
      z.object({
        taskId: z.number().int(),
      })
    )
    .query(async ({ input }) => {
      try {
        const task = await getTaskDetails(input.taskId);

        if (!task) {
          throw new Error("Task not found");
        }

        return {
          success: true,
          task,
        };
      } catch (error) {
        console.error("[Workflow] Error getting task details:", error);
        throw new Error(`Failed to get task details: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Retry failed task
   */
  retryTask: protectedProcedure
    .input(
      z.object({
        taskId: z.number().int(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const success = await retryFailedTask(input.taskId);

        return {
          success,
          message: "Task retry scheduled",
        };
      } catch (error) {
        console.error("[Workflow] Error retrying task:", error);
        throw new Error(`Failed to retry task: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Skip a task
   */
  skipTask: protectedProcedure
    .input(
      z.object({
        taskId: z.number().int(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const success = await skipTask(input.taskId, input.reason);

        return {
          success,
          message: "Task skipped",
        };
      } catch (error) {
        console.error("[Workflow] Error skipping task:", error);
        throw new Error(`Failed to skip task: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Cancel all pending tasks for a project
   */
  cancelProject: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Verify project ownership
        const project = await db
          .select()
          .from(videoProjects)
          .where(eq(videoProjects.id, input.projectId))
          .limit(1);

        if (project.length === 0 || project[0].userId !== ctx.user.id) {
          throw new Error("Project not found or unauthorized");
        }

        const cancelledCount = await cancelProjectTasks(input.projectId, input.reason);

        return {
          success: true,
          cancelledCount,
          message: `Cancelled ${cancelledCount} pending tasks`,
        };
      } catch (error) {
        console.error("[Workflow] Error cancelling project:", error);
        throw new Error(`Failed to cancel project: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Get workflow statistics
   */
  getStats: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Verify project ownership
        const project = await db
          .select()
          .from(videoProjects)
          .where(eq(videoProjects.id, input.projectId))
          .limit(1);

        if (project.length === 0 || project[0].userId !== ctx.user.id) {
          throw new Error("Project not found or unauthorized");
        }

        const stats = await getWorkflowStats(input.projectId);

        return {
          success: true,
          stats,
        };
      } catch (error) {
        console.error("[Workflow] Error getting stats:", error);
        throw new Error(`Failed to get stats: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),
});
