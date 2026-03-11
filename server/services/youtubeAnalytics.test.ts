import { describe, it, expect } from "vitest";
import * as youtubeAnalyticsService from "./youtubeAnalyticsService";
import * as multiChannelService from "./multiChannelService";
import * as audienceSegmentationService from "./audienceSegmentationService";

describe("YouTube Analytics Service", () => {
  describe("getVideoMetrics", () => {
    it("should return video metrics", async () => {
      const metrics = await youtubeAnalyticsService.getVideoMetrics("vid-123");
      expect(metrics).toBeDefined();
      expect(metrics.videoId).toBe("vid-123");
      expect(metrics.views).toBeGreaterThan(0);
      expect(metrics.likes).toBeGreaterThan(0);
    });

    it("should have engagement rate", async () => {
      const metrics = await youtubeAnalyticsService.getVideoMetrics("vid-123");
      expect(metrics.engagementRate).toBeGreaterThanOrEqual(0);
      expect(metrics.engagementRate).toBeLessThanOrEqual(100);
    });
  });

  describe("getChannelMetrics", () => {
    it("should return channel metrics", async () => {
      const metrics = await youtubeAnalyticsService.getChannelMetrics("ch-123");
      expect(metrics).toBeDefined();
      expect(metrics.channelId).toBe("ch-123");
      expect(metrics.subscribers).toBeGreaterThanOrEqual(0);
      expect(metrics.totalViews).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getAudienceDemographics", () => {
    it("should return demographics data", async () => {
      const demographics = await youtubeAnalyticsService.getAudienceDemographics("ch-123");
      expect(demographics).toBeDefined();
      expect(demographics.ageGroup).toBeDefined();
      expect(demographics.gender).toBeDefined();
      expect(demographics.topCountries).toBeDefined();
    });

    it("should have valid gender distribution", async () => {
      const demographics = await youtubeAnalyticsService.getAudienceDemographics("ch-123");
      const totalGender = Object.values(demographics.gender).reduce((a: any, b: any) => a + b, 0);
      expect(totalGender).toBe(100);
    });
  });

  describe("getTrendingVideos", () => {
    it("should return trending videos", async () => {
      const videos = await youtubeAnalyticsService.getTrendingVideos("Education");
      expect(Array.isArray(videos)).toBe(true);
      expect(videos.length).toBeGreaterThan(0);
    });

    it("should respect limit parameter", async () => {
      const videos = await youtubeAnalyticsService.getTrendingVideos("Education", 5);
      expect(videos.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getRealtimeVideoStats", () => {
    it("should return realtime stats", async () => {
      const stats = await youtubeAnalyticsService.getRealtimeVideoStats("vid-123");
      expect(stats).toBeDefined();
      expect(stats.currentViews).toBeGreaterThanOrEqual(0);
      expect(stats.viewsPerHour).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getAudienceRetention", () => {
    it("should return retention data", async () => {
      const retention = await youtubeAnalyticsService.getAudienceRetention("vid-123");
      expect(retention).toBeDefined();
      expect(retention.averageRetention).toBeGreaterThanOrEqual(0);
      expect(retention.averageRetention).toBeLessThanOrEqual(100);
      expect(Array.isArray(retention.retentionCurve)).toBe(true);
    });
  });
});

describe("Multi-Channel Management Service", () => {
  const userId = "user-123";

  describe("getUserChannels", () => {
    it("should return user channels", async () => {
      const channels = await multiChannelService.getUserChannels(userId);
      expect(Array.isArray(channels)).toBe(true);
      expect(channels.length).toBeGreaterThan(0);
    });

    it("should have required fields", async () => {
      const channels = await multiChannelService.getUserChannels(userId);
      channels.forEach((channel) => {
        expect(channel.id).toBeDefined();
        expect(channel.channelId).toBeDefined();
        expect(channel.channelName).toBeDefined();
        expect(channel.subscribers).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("getPrimaryChannel", () => {
    it("should return primary channel", async () => {
      const primary = await multiChannelService.getPrimaryChannel(userId);
      expect(primary).toBeDefined();
      expect(primary?.isPrimary).toBe(true);
    });
  });

  describe("addChannel", () => {
    it("should add new channel", async () => {
      const newChannel = await multiChannelService.addChannel(
        userId,
        "UCnewchannel",
        "New Channel",
        "access-token",
        "refresh-token"
      );
      expect(newChannel).toBeDefined();
      expect(newChannel.channelName).toBe("New Channel");
      expect(newChannel.isActive).toBe(true);
    });
  });

  describe("getChannelPortfolio", () => {
    it("should return portfolio analytics", async () => {
      const portfolio = await multiChannelService.getChannelPortfolio(userId);
      expect(portfolio).toBeDefined();
      expect(portfolio.userId).toBe(userId);
      expect(portfolio.channels).toBeDefined();
      expect(portfolio.totalSubscribers).toBeGreaterThanOrEqual(0);
      expect(portfolio.totalViews).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getChannelHealthScore", () => {
    it("should return health score", async () => {
      const health = await multiChannelService.getChannelHealthScore("ch-123");
      expect(health).toBeDefined();
      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
      expect(["excellent", "good", "fair", "poor"]).toContain(health.status);
    });
  });
});

describe("Audience Segmentation Service", () => {
  describe("getAudienceSegments", () => {
    it("should return audience segments", async () => {
      const segments = await audienceSegmentationService.getAudienceSegments("ch-123");
      expect(Array.isArray(segments)).toBe(true);
      expect(segments.length).toBeGreaterThan(0);
    });

    it("should have valid segment data", async () => {
      const segments = await audienceSegmentationService.getAudienceSegments("ch-123");
      segments.forEach((segment) => {
        expect(segment.id).toBeDefined();
        expect(segment.name).toBeDefined();
        expect(segment.size).toBeGreaterThanOrEqual(0);
        expect(segment.percentage).toBeGreaterThanOrEqual(0);
        expect(segment.percentage).toBeLessThanOrEqual(100);
        expect(["high", "medium", "low"]).toContain(segment.engagementLevel);
      });
    });

    it("should have total percentage of 100", async () => {
      const segments = await audienceSegmentationService.getAudienceSegments("ch-123");
      const totalPercentage = segments.reduce((sum, seg) => sum + seg.percentage, 0);
      expect(totalPercentage).toBe(100);
    });
  });

  describe("getSegmentContentRecommendations", () => {
    it("should return content recommendations", async () => {
      const recommendations = await audienceSegmentationService.getSegmentContentRecommendations("ch-123");
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it("should have hooks and topics", async () => {
      const recommendations = await audienceSegmentationService.getSegmentContentRecommendations("ch-123");
      recommendations.forEach((rec) => {
        expect(Array.isArray(rec.recommendedHooks)).toBe(true);
        expect(Array.isArray(rec.recommendedTopics)).toBe(true);
        expect(rec.recommendedHooks.length).toBeGreaterThan(0);
        expect(rec.recommendedTopics.length).toBeGreaterThan(0);
      });
    });
  });

  describe("analyzeAudienceBehavior", () => {
    it("should return behavior analysis", async () => {
      const behavior = await audienceSegmentationService.analyzeAudienceBehavior("ch-123");
      expect(behavior).toBeDefined();
      expect(Array.isArray(behavior.peakWatchingHours)).toBe(true);
      expect(behavior.preferredDevices).toBeDefined();
      expect(behavior.trafficSources).toBeDefined();
    });
  });

  describe("getAudienceInsights", () => {
    it("should return insights", async () => {
      const insights = await audienceSegmentationService.getAudienceInsights("ch-123");
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    it("should have actionable insights", async () => {
      const insights = await audienceSegmentationService.getAudienceInsights("ch-123");
      insights.forEach((insight) => {
        expect(insight.insight).toBeDefined();
        expect(typeof insight.actionable).toBe("boolean");
        expect(["high", "medium", "low"]).toContain(insight.priority);
        expect(insight.suggestedAction).toBeDefined();
      });
    });
  });

  describe("createCustomSegment", () => {
    it("should create custom segment", async () => {
      const segment = await audienceSegmentationService.createCustomSegment("ch-123", "Tech Lovers", {
        interests: ["AI", "Tech"],
        ageRange: "18-35",
      });
      expect(segment).toBeDefined();
      expect(segment.name).toBe("Tech Lovers");
      expect(segment.interests).toContain("AI");
    });
  });

  describe("getPersonalizedContent", () => {
    it("should return personalized content", async () => {
      const content = await audienceSegmentationService.getPersonalizedContent("seg-123");
      expect(content).toBeDefined();
      expect(Array.isArray(content.videoIdeas)).toBe(true);
      expect(Array.isArray(content.thumbnailConcepts)).toBe(true);
      expect(Array.isArray(content.hashtags)).toBe(true);
    });
  });

  describe("predictSegmentGrowth", () => {
    it("should predict segment growth", async () => {
      const prediction = await audienceSegmentationService.predictSegmentGrowth("ch-123", "seg-123", 30);
      expect(prediction).toBeDefined();
      expect(prediction.currentSize).toBeGreaterThanOrEqual(0);
      expect(prediction.projectedSize).toBeGreaterThanOrEqual(0);
      expect(prediction.growthRate).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("getSegmentEngagementMetrics", () => {
    it("should return engagement metrics", async () => {
      const metrics = await audienceSegmentationService.getSegmentEngagementMetrics("seg-123");
      expect(metrics).toBeDefined();
      expect(metrics.likeRate).toBeGreaterThanOrEqual(0);
      expect(metrics.commentRate).toBeGreaterThanOrEqual(0);
      expect(metrics.shareRate).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(metrics.retentionCurve)).toBe(true);
    });
  });
});
