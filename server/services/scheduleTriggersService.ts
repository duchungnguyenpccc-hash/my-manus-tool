import { CronJob } from "cron";
import { getDb } from "../db";
import { videoProjects } from "../../drizzle/schema";
import { readTopicsFromSheet } from "./googleSheetsService";
import { enqueueWorkflowJob } from "./workflowDispatchService";

/**
 * Schedule Triggers Service
 * Manages cron jobs to automatically trigger video generation workflows
 */

export interface ScheduleConfig {
  userId: number;
  cronExpression: string; // e.g., "0 9 * * *" for daily at 9 AM
  googleSheetsConfig: {
    spreadsheetId: string;
    sheetName: string;
    topicRange: string; // e.g., "A2:A100"
  };
  workflowConfig: {
    sceneCount: number;
    duration: number; // in seconds
    voiceId?: string;
    imageModel?: "qwen" | "flux1-schnell";
    videoModel?: "veo3-image-to-video" | "kling-image-to-video";
  };
  autoPublish?: boolean;
  maxConcurrentWorkflows?: number;
}

interface ActiveSchedule {
  userId: number;
  scheduleId: string;
  cronJob: CronJob;
  config: ScheduleConfig;
  isRunning: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

// Store active schedules in memory
const activeSchedules = new Map<string, ActiveSchedule>();

/**
 * Create a new schedule trigger
 */
export async function createScheduleTrigger(config: ScheduleConfig): Promise<{
  success: boolean;
  scheduleId?: string;
  error?: string;
}> {
  try {
    console.log(`[Schedule Triggers] Creating schedule for user ${config.userId}`);

    const scheduleId = `schedule_${config.userId}_${Date.now()}`;

    // Validate cron expression
    if (!isValidCronExpression(config.cronExpression)) {
      throw new Error("Invalid cron expression");
    }

    // Create cron job
    const cronJob = new CronJob(
      config.cronExpression,
      async () => {
        console.log(`[Schedule Triggers] Executing scheduled workflow for ${scheduleId}`);
        await executeScheduledWorkflow(config);
      },
      null, // onComplete
      true, // start immediately
      "UTC" // timezone
    );

    // Store active schedule
    const nextRunTime = cronJob.nextDate();
    activeSchedules.set(scheduleId, {
      userId: config.userId,
      scheduleId,
      cronJob,
      config,
      isRunning: true,
      lastRun: undefined,
      nextRun: typeof nextRunTime === "object" && "toJSDate" in nextRunTime ? nextRunTime.toJSDate() : new Date(),
    });

    console.log(`[Schedule Triggers] Schedule created: ${scheduleId}`);

    return {
      success: true,
      scheduleId,
    };
  } catch (error) {
    console.error(`[Schedule Triggers] Error creating schedule:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute scheduled workflow
 */
async function executeScheduledWorkflow(config: ScheduleConfig): Promise<void> {
  try {
    console.log(`[Schedule Triggers] Starting scheduled workflow execution`);

    // Step 1: Read topics from Google Sheets
    console.log(`[Schedule Triggers] Reading topics from Google Sheets...`);
    const topics = await readTopicsFromSheet(config.userId, {
      spreadsheetId: config.googleSheetsConfig.spreadsheetId,
      sheetName: config.googleSheetsConfig.sheetName,
      range: config.googleSheetsConfig.topicRange,
    });

    if (!topics || topics.length === 0) {
      console.log(`[Schedule Triggers] No topics found in Google Sheets`);
      return;
    }

    console.log(`[Schedule Triggers] Found ${topics.length} topics`);

    // Step 2: Create video projects for each topic
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const workflowJobs: Array<{ projectId: number; topic: string }> = [];

    for (const topicItem of topics) {
      const topicText = typeof topicItem === "string" ? topicItem : (topicItem as any).topic;
      const titleText = typeof topicItem === "string" ? `Video from ${topicItem}` : `Video from ${(topicItem as any).topic}`;
      
      try {
        const inserted: any = await db.insert(videoProjects).values({
          userId: config.userId,
          title: titleText,
          topic: topicText,
          status: "processing",
          config: config.workflowConfig as any,
        });

        const projectId = Number(inserted?.[0]?.insertId ?? inserted?.insertId ?? 0);
        if (projectId) {
          workflowJobs.push({ projectId, topic: topicText });
        }
      } catch (error) {
        console.error(`[Schedule Triggers] Error creating project for topic ${topicText}:`, error);
      }
    }

    console.log(`[Schedule Triggers] Created ${workflowJobs.length} projects`);

    // Step 3: Enqueue workflows to durable queue
    for (const { projectId, topic } of workflowJobs) {
      await enqueueWorkflowJob({
        userId: config.userId,
        projectId,
        payload: {
          topic,
          sceneCount: config.workflowConfig.sceneCount,
          duration: config.workflowConfig.duration,
          voiceId: config.workflowConfig.voiceId,
          imageModel: config.workflowConfig.imageModel === "flux1-schnell" ? "flux" : "qwen",
          videoModel: config.workflowConfig.videoModel === "kling-image-to-video" ? "kling" : "veo3",
        },
      });
    }

    console.log(`[Schedule Triggers] Enqueued ${workflowJobs.length} workflows`);
  } catch (error) {
    console.error(`[Schedule Triggers] Error executing scheduled workflow:`, error);
  }
}

/**
 * Get active schedule
 */
export function getSchedule(scheduleId: string): ActiveSchedule | undefined {
  return activeSchedules.get(scheduleId);
}

/**
 * List all active schedules for a user
 */
export function listSchedules(userId: number): ActiveSchedule[] {
  return Array.from(activeSchedules.values()).filter((s) => s.userId === userId);
}

/**
 * Stop a schedule
 */
export function stopSchedule(scheduleId: string): boolean {
  const schedule = activeSchedules.get(scheduleId);
  if (!schedule) {
    return false;
  }

  schedule.cronJob.stop();
  schedule.isRunning = false;
  console.log(`[Schedule Triggers] Schedule stopped: ${scheduleId}`);
  return true;
}

/**
 * Start a stopped schedule
 */
export function startSchedule(scheduleId: string): boolean {
  const schedule = activeSchedules.get(scheduleId);
  if (!schedule) {
    return false;
  }

  schedule.cronJob.start();
  schedule.isRunning = true;
  const nextRunTime = schedule.cronJob.nextDate();
  schedule.nextRun = typeof nextRunTime === "object" && "toJSDate" in nextRunTime ? nextRunTime.toJSDate() : new Date();
  console.log(`[Schedule Triggers] Schedule started: ${scheduleId}`);
  return true;
}

/**
 * Delete a schedule
 */
export function deleteSchedule(scheduleId: string): boolean {
  const schedule = activeSchedules.get(scheduleId);
  if (!schedule) {
    return false;
  }

  schedule.cronJob.stop();
  activeSchedules.delete(scheduleId);
  console.log(`[Schedule Triggers] Schedule deleted: ${scheduleId}`);
  return true;
}

/**
 * Update schedule configuration
 */
export function updateSchedule(scheduleId: string, config: Partial<ScheduleConfig>): boolean {
  const schedule = activeSchedules.get(scheduleId);
  if (!schedule) {
    return false;
  }

  // Stop current job
  schedule.cronJob.stop();

  // Update config
  schedule.config = { ...schedule.config, ...config };

  // Create new cron job with updated config
  const newCronJob = new CronJob(
    schedule.config.cronExpression,
    async () => {
      await executeScheduledWorkflow(schedule.config);
    },
    null,
    true,
    "UTC"
  );

  schedule.cronJob = newCronJob;
  const nextRunTime = newCronJob.nextDate();
  schedule.nextRun = typeof nextRunTime === "object" && "toJSDate" in nextRunTime ? nextRunTime.toJSDate() : new Date();

  console.log(`[Schedule Triggers] Schedule updated: ${scheduleId}`);
  return true;
}

/**
 * Validate cron expression
 */
function isValidCronExpression(expression: string): boolean {
  try {
    new CronJob(expression, () => {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Get next run time for a schedule
 */
export function getNextRunTime(scheduleId: string): Date | null {
  const schedule = activeSchedules.get(scheduleId);
  if (!schedule || !schedule.isRunning) {
    return null;
  }

  const nextRunTime = schedule.cronJob.nextDate();
  return typeof nextRunTime === "object" && "toJSDate" in nextRunTime ? nextRunTime.toJSDate() : new Date();
}

/**
 * Get last run time for a schedule
 */
export function getLastRunTime(scheduleId: string): Date | undefined {
  const schedule = activeSchedules.get(scheduleId);
  return schedule?.lastRun;
}

/**
 * Manual trigger for a schedule
 */
export async function manualTriggerSchedule(scheduleId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const schedule = activeSchedules.get(scheduleId);
    if (!schedule) {
      throw new Error("Schedule not found");
    }

    console.log(`[Schedule Triggers] Manual trigger for schedule ${scheduleId}`);
    await executeScheduledWorkflow(schedule.config);

    schedule.lastRun = new Date();

    return { success: true };
  } catch (error) {
    console.error(`[Schedule Triggers] Error triggering schedule:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get schedule statistics
 */
export function getScheduleStats(scheduleId: string): {
  isRunning: boolean;
  lastRun?: Date;
  nextRun?: Date;
  totalRuns?: number;
} | null {
  const schedule = activeSchedules.get(scheduleId);
  if (!schedule) {
    return null;
  }

  return {
    isRunning: schedule.isRunning,
    lastRun: schedule.lastRun,
    nextRun: schedule.nextRun,
  };
}
