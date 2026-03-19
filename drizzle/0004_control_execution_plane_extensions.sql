CREATE TABLE `campaigns` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `nicheId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` enum('active','paused','archived') NOT NULL DEFAULT 'active',
  `strategy` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);

CREATE TABLE `topic_candidates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `nicheId` int NOT NULL,
  `topic` text NOT NULL,
  `titleSuggestion` varchar(255),
  `hookSuggestion` text,
  `score` int NOT NULL DEFAULT 0,
  `source` varchar(80) NOT NULL DEFAULT 'ai_generator',
  `status` enum('generated','approved','rejected','queued') NOT NULL DEFAULT 'generated',
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `topic_candidates_id` PRIMARY KEY(`id`)
);

CREATE TABLE `job_idempotency_keys` (
  `id` int AUTO_INCREMENT NOT NULL,
  `key` varchar(255) NOT NULL,
  `workerType` varchar(64) NOT NULL,
  `status` enum('processing','completed','failed') NOT NULL DEFAULT 'processing',
  `payloadHash` varchar(255),
  `lastError` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `job_idempotency_keys_id` PRIMARY KEY(`id`),
  CONSTRAINT `job_idempotency_keys_key_unique` UNIQUE(`key`)
);
