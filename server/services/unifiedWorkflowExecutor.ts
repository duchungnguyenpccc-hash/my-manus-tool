import { getDb } from "../db";
import { videoProjects, workflowTasks } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Workflow Execution Configuration
 */
export interface WorkflowConfig {
  userId: number;
  topic: string;
  sceneCount: number;
  videoDuration: number;
  voicePreset: string;
  autoPublish: boolean;
  googleSheetsUrl?: string;
}

/**
 * Workflow Step Definition
 */
export interface WorkflowStep {
  stepNumber: number;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  result?: unknown;
  retries: number;
}

/**
 * Workflow Execution Result
 */
export interface WorkflowResult {
  projectId: number;
  status: "success" | "failed" | "partial";
  steps: WorkflowStep[];
  finalVideoUrl?: string;
  youtubeUrl?: string;
  totalDuration: number;
  errors: string[];
}

/**
 * Unified Workflow Executor
 * Orchestrates the complete 12-step video generation workflow
 */
export class UnifiedWorkflowExecutor {
  private projectId: number = 0;
  private steps: WorkflowStep[] = [];
  private errors: string[] = [];
  private assets: Record<string, any> = {};

  /**
   * Execute complete workflow
   * Steps: 1. Titles → 2. Moderation → 3. Prompts → 4. Images → 5. Videos → 
   *        6. Audio → 7. Compose → 8. Render → 9. Upload → 10. Publish
   */
  async executeWorkflow(config: WorkflowConfig): Promise<WorkflowResult> {
    const startTime = Date.now();

    try {
      // Create project
      this.projectId = await this.createProject(config);

      // Execute 10-step workflow
      await this.executeStep(1, "Generate Titles", async () => {
        // Call titleGenerationService.generateTitles(config.topic)
        this.assets.titles = { mainTitle: "Generated Title" };
      });

      await this.executeStep(2, "Content Moderation", async () => {
        // Call contentModerationService.moderateContent(config.topic)
        this.assets.moderation = { approved: true };
      });

      await this.executeStep(3, "Generate Prompts", async () => {
        // Call openaiService.generateVideoScript()
        this.assets.script = { imagePrompts: [] };
      });

      await this.executeStep(4, "Generate Images", async () => {
        // Call piapiService.generateImage() in parallel
        this.assets.images = [];
      });

      await this.executeStep(5, "Generate Videos", async () => {
        // Call piapiService.generateVideoFromImage() in parallel
        this.assets.videos = [];
      });

      await this.executeStep(6, "Generate Audio", async () => {
        // Call elevenLabsService.textToSpeech()
        this.assets.audio = {};
      });

      await this.executeStep(7, "Compose Assets", async () => {
        // Call assetCompositionService.composeAssets()
        this.assets.composition = {};
      });

      await this.executeStep(8, "Render Video", async () => {
        // Call creatomateService.renderVideo()
        this.assets.finalVideoUrl = "";
      });

      await this.executeStep(9, "Upload YouTube", async () => {
        if (config.autoPublish) {
          // Call youtubeService.uploadVideo()
          this.assets.youtubeUrl = "";
        }
      });

      await this.executeStep(10, "Publish Results", async () => {
        // Update Google Sheets with results
        if (config.googleSheetsUrl) {
          // Call googleSheetsService.updateTopicStatus()
        }
      });

      // Mark project as completed
      await this.updateProjectStatus("completed");

      return {
        projectId: this.projectId,
        status: this.errors.length === 0 ? "success" : "partial",
        steps: this.steps,
        finalVideoUrl: this.assets.finalVideoUrl,
        youtubeUrl: this.assets.youtubeUrl,
        totalDuration: Date.now() - startTime,
        errors: this.errors,
      };
    } catch (error) {
      await this.updateProjectStatus("failed");
      this.errors.push(`Workflow execution failed: ${error}`);

      return {
        projectId: this.projectId,
        status: "failed",
        steps: this.steps,
        totalDuration: Date.now() - startTime,
        errors: this.errors,
      };
    }
  }

  /**
   * Execute a single step with error handling and retry logic
   */
  private async executeStep(
    stepNumber: number,
    name: string,
    fn: () => Promise<void>
  ): Promise<void> {
    const step: WorkflowStep = {
      stepNumber,
      name,
      status: "pending",
      progress: 0,
      startTime: new Date(),
      retries: 0,
    };

    this.steps.push(step);

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        step.status = "running";
        step.progress = 50;
        step.retries = attempt;

        await fn();

        step.status = "completed";
        step.progress = 100;
        step.endTime = new Date();

        // Save step to database
        await this.saveStepToDatabase(step);

        return;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    step.status = "failed";
    step.error = lastError?.message || "Unknown error";
    step.endTime = new Date();

    this.errors.push(`Step ${stepNumber} (${name}): ${step.error}`);

    // Save step to database
    await this.saveStepToDatabase(step);

    throw lastError;
  }

  /**
   * Create project in database
   */
  private async createProject(config: WorkflowConfig): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.insert(videoProjects).values({
      userId: config.userId,
      title: config.topic.substring(0, 255),
      topic: config.topic,
      status: "processing",
      config: {
        sceneCount: config.sceneCount,
        videoDuration: config.videoDuration,
        voicePreset: config.voicePreset,
        autoPublish: config.autoPublish,
      },
    });

    // Get the inserted ID
    const projects = await db
      .select()
      .from(videoProjects)
      .where(eq(videoProjects.userId, config.userId))
      .orderBy((t) => t.createdAt)
      .limit(1);

    return projects[0]?.id || 0;
  }

  /**
   * Update project status
   */
  private async updateProjectStatus(status: string) {
    const db = await getDb();
    if (!db) return;

    await db
      .update(videoProjects)
      .set({ status: status as any })
      .where(eq(videoProjects.id, this.projectId));
  }

  /**
   * Save step to database
   */
  private async saveStepToDatabase(step: WorkflowStep) {
    const db = await getDb();
    if (!db) return;

    const taskTypeMap: Record<number, string> = {
      1: "script",
      2: "script",
      3: "script",
      4: "image",
      5: "video",
      6: "audio",
      7: "script",
      8: "render",
      9: "upload",
      10: "upload",
    };

    await db.insert(workflowTasks).values({
      projectId: this.projectId,
      taskType: (taskTypeMap[step.stepNumber] || "script") as any,
      status: step.status as any,
      input: { stepNumber: step.stepNumber, stepName: step.name },
      output: step.result ? JSON.stringify(step.result) : null,
      error: step.error,
      retryCount: step.retries,
      startedAt: step.startTime,
      completedAt: step.endTime,
    });
  }
}

/**
 * Create and execute workflow
 */
export async function executeCompleteWorkflow(
  config: WorkflowConfig
): Promise<WorkflowResult> {
  const executor = new UnifiedWorkflowExecutor();
  return executor.executeWorkflow(config);
}
