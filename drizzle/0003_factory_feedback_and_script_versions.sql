CREATE TABLE `script_versions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `userId` int NOT NULL,
  `nicheId` int,
  `versionNumber` int NOT NULL,
  `versionLabel` varchar(64) NOT NULL,
  `prompt` text NOT NULL,
  `content` text NOT NULL,
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `script_versions_id` PRIMARY KEY(`id`)
);

CREATE TABLE `analytics_feedback` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `projectId` int NOT NULL,
  `nicheId` int,
  `youtubeVideoId` varchar(255) NOT NULL,
  `views` bigint NOT NULL DEFAULT 0,
  `watchTimeMinutes` bigint NOT NULL DEFAULT 0,
  `ctr` int NOT NULL DEFAULT 0,
  `engagementRate` int NOT NULL DEFAULT 0,
  `likes` bigint NOT NULL DEFAULT 0,
  `comments` bigint NOT NULL DEFAULT 0,
  `shares` bigint NOT NULL DEFAULT 0,
  `rawMetrics` json,
  `capturedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `analytics_feedback_id` PRIMARY KEY(`id`)
);
