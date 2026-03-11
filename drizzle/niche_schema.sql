-- Niche Management Database Schema
-- Phase 18: Niche Database Implementation

-- Create niches table
CREATE TABLE IF NOT EXISTS niches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  nicheName VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  targetAudience JSON,
  trendingTopics JSON,
  hookTemplates JSON,
  thumbnailStyle JSON,
  musicPreferences JSON,
  uploadSchedule JSON,
  performanceTargets JSON,
  monetizationStrategy JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_category (category),
  UNIQUE KEY unique_niche_per_user (userId, nicheName)
);

-- Create niche_channels table
CREATE TABLE IF NOT EXISTS niche_channels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nicheId INT NOT NULL,
  youtubeChannelId VARCHAR(255),
  channelName VARCHAR(255),
  subscribers INT DEFAULT 0,
  monetizationStatus ENUM('active', 'pending', 'inactive') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (nicheId) REFERENCES niches(id) ON DELETE CASCADE,
  INDEX idx_nicheId (nicheId),
  INDEX idx_youtubeChannelId (youtubeChannelId)
);

-- Create niche_performance table
CREATE TABLE IF NOT EXISTS niche_performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nicheId INT NOT NULL,
  videoId VARCHAR(255),
  views INT DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  retention DECIMAL(5,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nicheId) REFERENCES niches(id) ON DELETE CASCADE,
  INDEX idx_nicheId (nicheId),
  INDEX idx_videoId (videoId),
  INDEX idx_timestamp (timestamp)
);

-- Create niche_hooks table
CREATE TABLE IF NOT EXISTS niche_hooks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nicheId INT NOT NULL,
  hookText VARCHAR(500),
  hookType VARCHAR(100),
  performance JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nicheId) REFERENCES niches(id) ON DELETE CASCADE,
  INDEX idx_nicheId (nicheId)
);

-- Create niche_thumbnails table
CREATE TABLE IF NOT EXISTS niche_thumbnails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nicheId INT NOT NULL,
  thumbnailUrl VARCHAR(500),
  thumbnailStyle VARCHAR(100),
  ctrPrediction DECIMAL(5,2),
  performance JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nicheId) REFERENCES niches(id) ON DELETE CASCADE,
  INDEX idx_nicheId (nicheId)
);

-- Create niche_music table
CREATE TABLE IF NOT EXISTS niche_music (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nicheId INT NOT NULL,
  musicUrl VARCHAR(500),
  mood VARCHAR(100),
  duration INT,
  engagementScore DECIMAL(5,2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nicheId) REFERENCES niches(id) ON DELETE CASCADE,
  INDEX idx_nicheId (nicheId)
);

-- Create niche_trends table
CREATE TABLE IF NOT EXISTS niche_trends (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nicheId INT NOT NULL,
  trendingTopic VARCHAR(255),
  trendingScore DECIMAL(5,2),
  videoCount INT DEFAULT 0,
  avgViews INT DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nicheId) REFERENCES niches(id) ON DELETE CASCADE,
  INDEX idx_nicheId (nicheId),
  INDEX idx_timestamp (timestamp)
);

-- Create niche_content_routing table
CREATE TABLE IF NOT EXISTS niche_content_routing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  contentId VARCHAR(255),
  detectedNiche INT,
  confidenceScore DECIMAL(5,2),
  routedChannelId VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (detectedNiche) REFERENCES niches(id) ON DELETE SET NULL,
  INDEX idx_userId (userId),
  INDEX idx_contentId (contentId),
  INDEX idx_detectedNiche (detectedNiche)
);

-- Create indexes for performance
CREATE INDEX idx_niche_performance_composite ON niche_performance(nicheId, timestamp);
CREATE INDEX idx_niche_trends_composite ON niche_trends(nicheId, timestamp);
