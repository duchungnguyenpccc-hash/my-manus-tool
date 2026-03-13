CREATE TABLE `provider_configurations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `category` enum('script','image','voice','render') NOT NULL,
  `mode` enum('cloud','local') NOT NULL,
  `providerId` varchar(100) NOT NULL,
  `settings` json,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `provider_configurations_id` PRIMARY KEY(`id`)
);
