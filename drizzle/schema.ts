import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;


/**
 * Niches table - manage multiple content niches per user
 */
export const niches = mysqlTable("niches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nicheName: varchar("nicheName", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 120 }),
  targetAudience: json("targetAudience"),
  performanceTargets: json("performanceTargets"),
  monetizationStrategy: json("monetizationStrategy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Niche = typeof niches.$inferSelect;
export type InsertNiche = typeof niches.$inferInsert;

/**
 * Topic queue table - niche scoped topics waiting for execution
 */
export const nicheTopicQueue = mysqlTable("niche_topic_queue", {
  id: int("id").autoincrement().primaryKey(),
  nicheId: int("nicheId").notNull(),
  userId: int("userId").notNull(),
  topic: text("topic").notNull(),
  priority: int("priority").default(100).notNull(),
  status: mysqlEnum("status", ["queued", "claimed", "completed", "failed", "cancelled"]).default("queued").notNull(),
  source: varchar("source", { length: 80 }).default("manual").notNull(),
  projectId: int("projectId"),
  availableAt: timestamp("availableAt").defaultNow().notNull(),
  claimedAt: timestamp("claimedAt"),
  completedAt: timestamp("completedAt"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NicheTopicQueue = typeof nicheTopicQueue.$inferSelect;
export type InsertNicheTopicQueue = typeof nicheTopicQueue.$inferInsert;

/**
 * Workflow jobs table - durable queue for workflow workers
 */
export const workflowJobs = mysqlTable("workflow_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  nicheId: int("nicheId"),
  topicQueueId: int("topicQueueId"),
  payload: json("payload").notNull(),
  status: mysqlEnum("status", ["queued", "processing", "completed", "failed", "cancelled"]).default("queued").notNull(),
  attempts: int("attempts").default(0).notNull(),
  maxAttempts: int("maxAttempts").default(3).notNull(),
  availableAt: timestamp("availableAt").defaultNow().notNull(),
  lockedAt: timestamp("lockedAt"),
  completedAt: timestamp("completedAt"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkflowJob = typeof workflowJobs.$inferSelect;
export type InsertWorkflowJob = typeof workflowJobs.$inferInsert;

/**
 * API Keys table - stores encrypted API credentials for external services
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", ["openai", "piapi", "elevenlabs", "creatomate", "youtube"]).notNull(),
  encryptedKey: text("encryptedKey").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastTestedAt: timestamp("lastTestedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Video Projects table - stores video generation projects
 */
export const videoProjects = mysqlTable("video_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  topic: text("topic").notNull(),
  status: mysqlEnum("status", ["draft", "processing", "completed", "failed", "archived"]).default("draft").notNull(),
  config: json("config"), // JSON config: { sceneCount, duration, voiceId, model, etc }
  youtubeVideoId: varchar("youtubeVideoId", { length: 255 }),
  youtubeUrl: varchar("youtubeUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoProject = typeof videoProjects.$inferSelect;
export type InsertVideoProject = typeof videoProjects.$inferInsert;

/**
 * Workflow Tasks table - tracks individual tasks in the video generation pipeline
 */
export const workflowTasks = mysqlTable("workflow_tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  taskType: mysqlEnum("taskType", ["script", "image", "video", "audio", "render", "upload"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "skipped"]).default("pending").notNull(),
  input: json("input"), // Task input parameters
  output: json("output"), // Task output/results
  error: text("error"), // Error message if failed
  retryCount: int("retryCount").default(0).notNull(),
  maxRetries: int("maxRetries").default(3).notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkflowTask = typeof workflowTasks.$inferSelect;
export type InsertWorkflowTask = typeof workflowTasks.$inferInsert;

/**
 * Generated Assets table - tracks generated images, videos, and audio files
 */
export const generatedAssets = mysqlTable("generated_assets", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  projectId: int("projectId").notNull(),
  assetType: mysqlEnum("assetType", ["image", "video", "audio", "script"]).notNull(),
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  s3Url: varchar("s3Url", { length: 500 }).notNull(),
  metadata: json("metadata"), // Size, duration, format, etc
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GeneratedAsset = typeof generatedAssets.$inferSelect;
export type InsertGeneratedAsset = typeof generatedAssets.$inferInsert;

/**
 * YouTube Uploads table - tracks YouTube upload history
 */
export const youtubeUploads = mysqlTable("youtube_uploads", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  videoId: varchar("videoId", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  tags: json("tags"), // Array of tags
  thumbnail: varchar("thumbnail", { length: 500 }),
  status: mysqlEnum("status", ["uploading", "processing", "published", "failed", "unlisted", "private"]).default("processing").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  youtubeUrl: varchar("youtubeUrl", { length: 500 }),
  viewCount: bigint("viewCount", { mode: "number" }).default(0),
  likeCount: bigint("likeCount", { mode: "number" }).default(0),
  commentCount: bigint("commentCount", { mode: "number" }).default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type YoutubeUpload = typeof youtubeUploads.$inferSelect;
export type InsertYoutubeUpload = typeof youtubeUploads.$inferInsert;

/**
 * Script versions - lưu phiên bản script theo project để A/B testing
 */
export const scriptVersions = mysqlTable("script_versions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  nicheId: int("nicheId"),
  versionNumber: int("versionNumber").notNull(),
  versionLabel: varchar("versionLabel", { length: 64 }).notNull(),
  prompt: text("prompt").notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScriptVersion = typeof scriptVersions.$inferSelect;
export type InsertScriptVersion = typeof scriptVersions.$inferInsert;

/**
 * Analytics feedback - lưu snapshot metrics để tối ưu vòng lặp nội dung
 */
export const analyticsFeedback = mysqlTable("analytics_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  nicheId: int("nicheId"),
  youtubeVideoId: varchar("youtubeVideoId", { length: 255 }).notNull(),
  views: bigint("views", { mode: "number" }).default(0).notNull(),
  watchTimeMinutes: bigint("watchTimeMinutes", { mode: "number" }).default(0).notNull(),
  ctr: int("ctr").default(0).notNull(),
  engagementRate: int("engagementRate").default(0).notNull(),
  likes: bigint("likes", { mode: "number" }).default(0).notNull(),
  comments: bigint("comments", { mode: "number" }).default(0).notNull(),
  shares: bigint("shares", { mode: "number" }).default(0).notNull(),
  rawMetrics: json("rawMetrics"),
  capturedAt: timestamp("capturedAt").defaultNow().notNull(),
});

export type AnalyticsFeedback = typeof analyticsFeedback.$inferSelect;
export type InsertAnalyticsFeedback = typeof analyticsFeedback.$inferInsert;

/**
 * Campaigns - lớp Control Plane để quản lý chiến dịch theo niche
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nicheId: int("nicheId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "paused", "archived"]).default("active").notNull(),
  strategy: json("strategy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * Topic candidates - ideas do Trend + AI generator tạo ra trước khi vào queue
 */
export const topicCandidates = mysqlTable("topic_candidates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nicheId: int("nicheId").notNull(),
  topic: text("topic").notNull(),
  titleSuggestion: varchar("titleSuggestion", { length: 255 }),
  hookSuggestion: text("hookSuggestion"),
  score: int("score").default(0).notNull(),
  source: varchar("source", { length: 80 }).default("ai_generator").notNull(),
  status: mysqlEnum("status", ["generated", "approved", "rejected", "queued"]).default("generated").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TopicCandidate = typeof topicCandidates.$inferSelect;
export type InsertTopicCandidate = typeof topicCandidates.$inferInsert;

/**
 * Job idempotency - đảm bảo execution plane xử lý job idempotent
 */
export const jobIdempotencyKeys = mysqlTable("job_idempotency_keys", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  workerType: varchar("workerType", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["processing", "completed", "failed"]).default("processing").notNull(),
  payloadHash: varchar("payloadHash", { length: 255 }),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JobIdempotencyKey = typeof jobIdempotencyKeys.$inferSelect;
export type InsertJobIdempotencyKey = typeof jobIdempotencyKeys.$inferInsert;

/**
 * Provider configurations - hỗ trợ hybrid cloud/local provider per user
 */
export const providerConfigurations = mysqlTable("provider_configurations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: mysqlEnum("category", ["script", "image", "voice", "render"]).notNull(),
  mode: mysqlEnum("mode", ["cloud", "local"]).notNull(),
  providerId: varchar("providerId", { length: 100 }).notNull(),
  settings: json("settings"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProviderConfiguration = typeof providerConfigurations.$inferSelect;
export type InsertProviderConfiguration = typeof providerConfigurations.$inferInsert;
