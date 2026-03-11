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