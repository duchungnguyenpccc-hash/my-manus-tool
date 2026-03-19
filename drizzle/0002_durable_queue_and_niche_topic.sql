CREATE TABLE IF NOT EXISTS `niches` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `nicheName` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(120),
  `targetAudience` json,
  `performanceTargets` json,
  `monetizationStrategy` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `niches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `niche_topic_queue` (
  `id` int AUTO_INCREMENT NOT NULL,
  `nicheId` int NOT NULL,
  `userId` int NOT NULL,
  `topic` text NOT NULL,
  `priority` int NOT NULL DEFAULT 100,
  `status` enum('queued','claimed','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
  `source` varchar(80) NOT NULL DEFAULT 'manual',
  `projectId` int,
  `availableAt` timestamp NOT NULL DEFAULT (now()),
  `claimedAt` timestamp,
  `completedAt` timestamp,
  `error` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `niche_topic_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workflow_jobs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `projectId` int NOT NULL,
  `nicheId` int,
  `topicQueueId` int,
  `payload` json NOT NULL,
  `status` enum('queued','processing','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
  `attempts` int NOT NULL DEFAULT 0,
  `maxAttempts` int NOT NULL DEFAULT 3,
  `availableAt` timestamp NOT NULL DEFAULT (now()),
  `lockedAt` timestamp,
  `completedAt` timestamp,
  `error` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `workflow_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_niche_topic_queue_lookup` ON `niche_topic_queue` (`userId`,`nicheId`,`status`,`priority`);
--> statement-breakpoint
CREATE INDEX `idx_workflow_jobs_lookup` ON `workflow_jobs` (`status`,`availableAt`,`createdAt`);
