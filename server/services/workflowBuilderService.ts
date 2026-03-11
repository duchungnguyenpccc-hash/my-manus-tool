/**
 * No-Code Workflow Builder Service
 * Allows users to create and manage workflows without coding
 */

export interface WorkflowTemplate {
  id: string;
  userId: number;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStepConfig[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStepConfig {
  id: string;
  stepType: string;
  name: string;
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
  errorHandling: "retry" | "skip" | "stop";
  retryCount?: number;
}

export interface WorkflowExecution {
  id: string;
  templateId: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  startTime: Date;
  endTime?: Date;
  steps: WorkflowStepExecution[];
  logs: string[];
}

export interface WorkflowStepExecution {
  stepId: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startTime?: Date;
  endTime?: Date;
  output?: any;
  error?: string;
  duration: number;
}

// In-memory storage for demo
const templates = new Map<string, WorkflowTemplate>();

/**
 * Create a new workflow template
 */
export async function createWorkflowTemplate(
  userId: number,
  name: string,
  description: string,
  category: string,
  steps: WorkflowStepConfig[],
  isPublic: boolean = false
): Promise<WorkflowTemplate> {
  const id = `template-${Date.now()}`;
  const template: WorkflowTemplate = {
    id,
    userId,
    name,
    description,
    category,
    steps,
    isPublic,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  templates.set(id, template);
  return template;
}

/**
 * Get workflow templates for a user
 */
export async function getUserWorkflowTemplates(userId: number): Promise<WorkflowTemplate[]> {
  return Array.from(templates.values()).filter((t) => t.userId === userId);
}

/**
 * Get public workflow templates
 */
export async function getPublicWorkflowTemplates(category?: string): Promise<WorkflowTemplate[]> {
  let result = Array.from(templates.values()).filter((t) => t.isPublic);
  if (category) {
    result = result.filter((t) => t.category === category);
  }
  return result;
}

/**
 * Update workflow template
 */
export async function updateWorkflowTemplate(
  templateId: string,
  updates: Partial<WorkflowTemplate>
): Promise<WorkflowTemplate> {
  const template = templates.get(templateId);
  if (!template) {
    throw new Error("Template not found");
  }

  const updated = {
    ...template,
    ...updates,
    updatedAt: new Date(),
  };

  templates.set(templateId, updated);
  return updated;
}

/**
 * Delete workflow template
 */
export async function deleteWorkflowTemplate(templateId: string): Promise<boolean> {
  return templates.delete(templateId);
}

/**
 * Clone a workflow template
 */
export async function cloneWorkflowTemplate(
  templateId: string,
  userId: number,
  newName: string
): Promise<WorkflowTemplate> {
  const original = templates.get(templateId);
  if (!original) {
    throw new Error("Template not found");
  }

  const newId = `template-${Date.now()}`;
  const cloned: WorkflowTemplate = {
    ...original,
    id: newId,
    userId,
    name: newName,
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  templates.set(newId, cloned);
  return cloned;
}

/**
 * Get pre-built workflow templates
 */
export function getPrebuiltTemplates(): WorkflowTemplate[] {
  return [
    {
      id: "template-faceless-video",
      userId: 0,
      name: "Faceless Video Generation",
      description: "Complete workflow for generating faceless videos",
      category: "video-generation",
      steps: [
        {
          id: "step-1",
          stepType: "schedule",
          name: "Schedule Trigger",
          config: { cronExpression: "0 0 * * *" },
          inputs: [],
          outputs: ["timestamp"],
          errorHandling: "stop",
        },
        {
          id: "step-2",
          stepType: "scraper",
          name: "Viral Video Scraper",
          config: { platform: "youtube", limit: 10 },
          inputs: [],
          outputs: ["videos"],
          errorHandling: "retry",
          retryCount: 3,
        },
        {
          id: "step-3",
          stepType: "analyzer",
          name: "Hook Pattern Analysis",
          config: { analysisType: "hook" },
          inputs: ["videos"],
          outputs: ["patterns"],
          errorHandling: "retry",
          retryCount: 2,
        },
        {
          id: "step-4",
          stepType: "generator",
          name: "Hook Generator",
          config: { count: 10 },
          inputs: ["patterns"],
          outputs: ["hooks"],
          errorHandling: "retry",
          retryCount: 2,
        },
        {
          id: "step-5",
          stepType: "generator",
          name: "Topic Generator",
          config: { trending: true },
          inputs: [],
          outputs: ["topics"],
          errorHandling: "retry",
          retryCount: 2,
        },
        {
          id: "step-6",
          stepType: "generator",
          name: "Script Engineering",
          config: { style: "engaging" },
          inputs: ["hooks", "topics"],
          outputs: ["script"],
          errorHandling: "retry",
          retryCount: 2,
        },
        {
          id: "step-7",
          stepType: "planner",
          name: "Scene Planner",
          config: { sceneCount: 10 },
          inputs: ["script"],
          outputs: ["scenes"],
          errorHandling: "retry",
          retryCount: 2,
        },
        {
          id: "step-8",
          stepType: "generator",
          name: "Generate Image",
          config: { quality: "high" },
          inputs: ["scenes"],
          outputs: ["images"],
          errorHandling: "retry",
          retryCount: 3,
        },
        {
          id: "step-9",
          stepType: "optimizer",
          name: "Thumbnail CTR Optimizer",
          config: { designCount: 3 },
          inputs: ["topics"],
          outputs: ["thumbnail"],
          errorHandling: "retry",
          retryCount: 2,
        },
        {
          id: "step-10",
          stepType: "generator",
          name: "Voice Generation",
          config: { voice: "natural", speed: 1 },
          inputs: ["script"],
          outputs: ["audio"],
          errorHandling: "retry",
          retryCount: 2,
        },
        {
          id: "step-11",
          stepType: "renderer",
          name: "Video Rendering",
          config: { quality: "1080p" },
          inputs: ["scenes", "images", "audio"],
          outputs: ["video"],
          errorHandling: "retry",
          retryCount: 2,
        },
        {
          id: "step-12",
          stepType: "generator",
          name: "SEO Metadata",
          config: { includeHashtags: true },
          inputs: ["topics", "script"],
          outputs: ["metadata"],
          errorHandling: "retry",
          retryCount: 2,
        },
        {
          id: "step-13",
          stepType: "uploader",
          name: "Upload YouTube",
          config: { visibility: "public" },
          inputs: ["video", "metadata", "thumbnail"],
          outputs: ["videoUrl"],
          errorHandling: "stop",
        },
      ],
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "template-quick-shorts",
      userId: 0,
      name: "Quick YouTube Shorts",
      description: "Fast workflow for generating YouTube Shorts",
      category: "shorts",
      steps: [
        {
          id: "step-1",
          stepType: "generator",
          name: "Hook Generator",
          config: { count: 5 },
          inputs: [],
          outputs: ["hooks"],
          errorHandling: "retry",
          retryCount: 2,
        },
        {
          id: "step-2",
          stepType: "generator",
          name: "Script Engineering",
          config: { style: "short", maxLength: 60 },
          inputs: ["hooks"],
          outputs: ["script"],
          errorHandling: "retry",
          retryCount: 2,
        },
        {
          id: "step-3",
          stepType: "generator",
          name: "Generate Image",
          config: { quality: "medium", count: 3 },
          inputs: ["script"],
          outputs: ["images"],
          errorHandling: "retry",
          retryCount: 2,
        },
        {
          id: "step-4",
          stepType: "generator",
          name: "Voice Generation",
          config: { voice: "energetic", speed: 1.2 },
          inputs: ["script"],
          outputs: ["audio"],
          errorHandling: "retry",
          retryCount: 2,
        },
        {
          id: "step-5",
          stepType: "renderer",
          name: "Video Rendering",
          config: { quality: "720p", format: "vertical" },
          inputs: ["images", "audio"],
          outputs: ["video"],
          errorHandling: "retry",
          retryCount: 2,
        },
        {
          id: "step-6",
          stepType: "uploader",
          name: "Upload YouTube Shorts",
          config: { visibility: "public" },
          inputs: ["video"],
          outputs: ["videoUrl"],
          errorHandling: "stop",
        },
      ],
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

/**
 * Get available step types
 */
export function getAvailableStepTypes(): Record<string, any> {
  return {
    schedule: {
      name: "Schedule Trigger",
      description: "Trigger workflow at scheduled time",
      inputs: [],
      outputs: ["timestamp"],
      config: {
        cronExpression: { type: "string", default: "0 0 * * *" },
      },
    },
    scraper: {
      name: "Viral Video Scraper",
      description: "Scrape trending videos",
      inputs: [],
      outputs: ["videos"],
      config: {
        platform: { type: "select", options: ["youtube", "tiktok", "instagram"], default: "youtube" },
        limit: { type: "number", default: 10 },
      },
    },
    analyzer: {
      name: "Content Analyzer",
      description: "Analyze content patterns",
      inputs: ["videos"],
      outputs: ["patterns"],
      config: {
        analysisType: { type: "select", options: ["hook", "structure", "emotion"], default: "hook" },
      },
    },
    generator: {
      name: "Content Generator",
      description: "Generate content",
      inputs: [],
      outputs: ["content"],
      config: {
        type: { type: "select", options: ["hook", "topic", "script", "title"], default: "hook" },
        count: { type: "number", default: 5 },
      },
    },
    optimizer: {
      name: "Content Optimizer",
      description: "Optimize content",
      inputs: ["content"],
      outputs: ["optimized"],
      config: {
        optimizationType: { type: "select", options: ["thumbnail", "title", "description"], default: "thumbnail" },
      },
    },
    renderer: {
      name: "Video Renderer",
      description: "Render video",
      inputs: ["scenes", "audio"],
      outputs: ["video"],
      config: {
        quality: { type: "select", options: ["720p", "1080p", "4k"], default: "1080p" },
      },
    },
    uploader: {
      name: "Upload Service",
      description: "Upload to platform",
      inputs: ["video"],
      outputs: ["url"],
      config: {
        platform: { type: "select", options: ["youtube", "tiktok", "instagram"], default: "youtube" },
        visibility: { type: "select", options: ["public", "private", "unlisted"], default: "public" },
      },
    },
  };
}
