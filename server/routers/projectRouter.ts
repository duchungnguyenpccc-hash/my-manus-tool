import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { videoProjects, workflowTasks } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { executeCompleteWorkflow } from "../services/unifiedWorkflowExecutor";

export const projectRouter = router({
  /**
   * Create new project and start workflow
   */
  create: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(10).max(1000),
        sceneCount: z.number().int().min(1).max(20),
        videoDuration: z.number().int().min(30).max(600),
        voicePreset: z.string(),
        autoPublish: z.boolean().default(false),
        googleSheetsUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Execute workflow
        const result = await executeCompleteWorkflow({
          userId: ctx.user.id,
          topic: input.topic,
          sceneCount: input.sceneCount,
          videoDuration: input.videoDuration,
          voicePreset: input.voicePreset,
          autoPublish: input.autoPublish,
          googleSheetsUrl: input.googleSheetsUrl,
        });

        return {
          success: true,
          projectId: result.projectId,
          status: result.status,
          message: `Project created successfully. Status: ${result.status}`,
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
          message: "Failed to create project",
        };
      }
    }),

  /**
   * Get project details
   */
  getById: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const project = await db
        .select()
        .from(videoProjects)
        .where(
          and(
            eq(videoProjects.id, input.projectId),
            eq(videoProjects.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!project.length) {
        throw new Error("Project not found");
      }

      // Get workflow tasks
      const tasks = await db
        .select()
        .from(workflowTasks)
        .where(eq(workflowTasks.projectId, input.projectId));

      return {
        project: project[0],
        tasks,
      };
    }),

  /**
   * List user projects
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const projects = await db
        .select()
        .from(videoProjects)
        .where(eq(videoProjects.userId, ctx.user.id))
        .orderBy((t) => t.createdAt)
        .limit(input.limit)
        .offset(input.offset);

      return projects;
    }),

  /**
   * Get project workflow progress
   */
  getProgress: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify project belongs to user
      const project = await db
        .select()
        .from(videoProjects)
        .where(
          and(
            eq(videoProjects.id, input.projectId),
            eq(videoProjects.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!project.length) {
        throw new Error("Project not found");
      }

      // Get workflow tasks
      const tasks = await db
        .select()
        .from(workflowTasks)
        .where(eq(workflowTasks.projectId, input.projectId));

      // Calculate progress
      const totalSteps = 10;
      const completedSteps = tasks.filter((t) => t.status === "completed").length;
      const failedSteps = tasks.filter((t) => t.status === "failed").length;
      const progress = (completedSteps / totalSteps) * 100;

      return {
        projectId: input.projectId,
        status: project[0].status,
        progress: Math.round(progress),
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

  /**
   * Delete project
   */
  delete: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify project belongs to user
      const project = await db
        .select()
        .from(videoProjects)
        .where(
          and(
            eq(videoProjects.id, input.projectId),
            eq(videoProjects.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!project.length) {
        throw new Error("Project not found");
      }

      // Delete project
      await db
        .update(videoProjects)
        .set({ status: "archived" })
        .where(eq(videoProjects.id, input.projectId));

      return { success: true, message: "Project archived" };
    }),

  /**
   * Get project statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const projects = await db
      .select()
      .from(videoProjects)
      .where(eq(videoProjects.userId, ctx.user.id));

    const stats = {
      totalProjects: projects.length,
      completedProjects: projects.filter((p) => p.status === "completed").length,
      processingProjects: projects.filter((p) => p.status === "processing").length,
      failedProjects: projects.filter((p) => p.status === "failed").length,
      archivedProjects: projects.filter((p) => p.status === "archived").length,
    };

    return stats;
  }),
});
