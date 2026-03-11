CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('openai','piapi','elevenlabs','creatomate','youtube') NOT NULL,
	`encryptedKey` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastTestedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generated_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`projectId` int NOT NULL,
	`assetType` enum('image','video','audio','script') NOT NULL,
	`s3Key` varchar(500) NOT NULL,
	`s3Url` varchar(500) NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generated_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`topic` text NOT NULL,
	`status` enum('draft','processing','completed','failed','archived') NOT NULL DEFAULT 'draft',
	`config` json,
	`youtubeVideoId` varchar(255),
	`youtubeUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`taskType` enum('script','image','video','audio','render','upload') NOT NULL,
	`status` enum('pending','processing','completed','failed','skipped') NOT NULL DEFAULT 'pending',
	`input` json,
	`output` json,
	`error` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflow_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `youtube_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`videoId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`tags` json,
	`thumbnail` varchar(500),
	`status` enum('uploading','processing','published','failed','unlisted','private') NOT NULL DEFAULT 'processing',
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`youtubeUrl` varchar(500),
	`viewCount` bigint DEFAULT 0,
	`likeCount` bigint DEFAULT 0,
	`commentCount` bigint DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `youtube_uploads_id` PRIMARY KEY(`id`),
	CONSTRAINT `youtube_uploads_videoId_unique` UNIQUE(`videoId`)
);
