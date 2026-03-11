import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createWorkflowTemplate,
  getUserWorkflowTemplates,
  getPublicWorkflowTemplates,
  updateWorkflowTemplate,
  deleteWorkflowTemplate,
  cloneWorkflowTemplate,
  getPrebuiltTemplates,
  getAvailableStepTypes,
  type WorkflowStepConfig,
} from "../services/workflowBuilderService";

const WorkflowStepSchema = z.object({
  id: z.string(),
  stepType: z.string(),
  name: z.string(),
  config: z.record(z.string(), z.any()),
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
  errorHandling: z.enum(["retry", "skip", "stop"]),
  retryCount: z.number().optional(),
});

export const workflowBuilderRouter = router({
  getPrebuiltTemplates: protectedProcedure.query(async () => {
    return getPrebuiltTemplates();
  }),

  getAvailableStepTypes: protectedProcedure.query(async () => {
    return getAvailableStepTypes();
  }),

  getUserTemplates: protectedProcedure.query(async ({ ctx }) => {
    return await getUserWorkflowTemplates(ctx.user.id);
  }),

  getPublicTemplates: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getPublicWorkflowTemplates(input.category);
    }),

  createTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        category: z.string(),
        steps: z.array(WorkflowStepSchema),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createWorkflowTemplate(
        ctx.user.id,
        input.name,
        input.description,
        input.category,
        input.steps as WorkflowStepConfig[],
        input.isPublic ?? false
      );
    }),

  updateTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        updates: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          steps: z.array(WorkflowStepSchema).optional(),
          isPublic: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await updateWorkflowTemplate(input.templateId, input.updates);
    }),

  deleteTemplate: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteWorkflowTemplate(input.templateId);
    }),

  cloneTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        newName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await cloneWorkflowTemplate(input.templateId, ctx.user.id, input.newName);
    }),
});
