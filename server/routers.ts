import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { apiKeyRouter } from "./routers/apiKeyRouter";
import { scriptRouter } from "./routers/scriptRouter";
import { imageVideoRouter } from "./routers/imageVideoRouter";
import { audioRouter } from "./routers/audioRouter";
import { renderRouter } from "./routers/renderRouter";
import { youtubeRouter } from "./routers/youtubeRouter";
import { workflowRouter } from "./routers/workflowRouter";
import { publishingRouter } from "./routers/publishingRouter";
import { contentRouter } from "./routers/contentRouter";
import { projectRouter } from "./routers/projectRouter";
import { contentStrategyRouter } from "./routers/contentStrategyRouter";
import { thumbnailRouter } from "./routers/thumbnailRouter";
import { hookGeneratorRouter } from "./routers/hookGeneratorRouter";
import { workflowBuilderRouter } from "./routers/workflowBuilderRouter";
import { csvImportRouter } from "./routers/csvImportRouter";
import { advancedSettingsRouter } from "./routers/advancedSettingsRouter";
import { youtubeAnalyticsRouter } from "./routers/youtubeAnalyticsRouter";
import { qualityControlRouter } from "./routers/qualityControlRouter";
import { autoOptimizationRouter } from "./routers/autoOptimizationRouter";
import { apiProviderRouter } from "./routers/apiProviderRouter";
import { nicheManagementRouter } from "./routers/nicheManagementRouter";
import { trendResearchRouter } from "./routers/trendResearchRouter";
import { controlPlaneRouter } from "./routers/controlPlaneRouter";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // API Key Management
  apiKey: apiKeyRouter,

  // Script Generation
  script: scriptRouter,

  // Image & Video Generation
  imageVideo: imageVideoRouter,

  // Audio Generation
  audio: audioRouter,

  // Video Rendering
  render: renderRouter,

  // YouTube Upload
  youtube: youtubeRouter,

  // Workflow Management
  workflow: workflowRouter,

  // Publishing Agent
  publishing: publishingRouter,

  // Content: Title Generation, Moderation, Composition
  content: contentRouter,

  // Project Management & Workflow Execution
  project: projectRouter,

  // Content Strategy & AI Recommendations
  contentStrategy: contentStrategyRouter,

  // Thumbnail Optimization
  thumbnail: thumbnailRouter,

  // Enhanced Hook Generator
  hookGenerator: hookGeneratorRouter,

  // No-Code Workflow Builder
  workflowBuilder: workflowBuilderRouter,

  // CSV Import & Batch Processing
  csvImport: csvImportRouter,
  advancedSettings: advancedSettingsRouter,
  youtubeAnalytics: youtubeAnalyticsRouter,
  qualityControl: qualityControlRouter,
  autoOptimization: autoOptimizationRouter,
  apiProvider: apiProviderRouter,
  niche: nicheManagementRouter,
  trendResearch: trendResearchRouter,
  controlPlane: controlPlaneRouter,
});

export type AppRouter = typeof appRouter;
