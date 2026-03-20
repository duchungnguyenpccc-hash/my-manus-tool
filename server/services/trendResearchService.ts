import axios from "axios";

export interface TrendingTopic {
  keyword: string;
  searchVolume: number;
  growthRate: number;
  category: string;
  relatedKeywords: string[];
  difficulty: number;
}

export interface YouTubeTrendingVideo {
  videoId: string;
  title: string;
  channelName: string;
  views: number;
  likes: number;
  comments: number;
  uploadedAt: string;
  duration: number;
  description: string;
  tags: string[];
  category: string;
  thumbnail: string;
}

export interface VideoAnalysis {
  videoId: string;
  title: string;
  scriptFormula: string;
  keyScenes: string[];
  audioPattern: string;
  visualStyle: string;
  engagementMetrics: {
    viewsPerDay: number;
    likeRate: number;
    commentRate: number;
  };
  contentStrategy: string;
}

export type TrendMomentum = {
  viewsPerDay: number;
  freshnessScore: number;
  velocityScore: number;
  momentumScore: number;
  ageHours: number;
};

export async function getTrendingTopics(category?: string, region?: string): Promise<TrendingTopic[]> {
  try {
    await axios.get("https://trends.google.com/trends/api/dailytrends", {
      params: { hl: region || "en-US", cat: category || "all", geo: region?.split("-")[1] || "US" },
      timeout: 10000,
    });
    return [];
  } catch (error) {
    console.error("[Trend Research] Error fetching trends:", error);
    return [];
  }
}

export async function getYouTubeTrendingVideos(category?: string, maxResults: number = 10): Promise<YouTubeTrendingVideo[]> {
  try {
    const now = Date.now();
    return Array.from({ length: maxResults }, (_, index) => ({
      videoId: `mock-${category ?? "all"}-${index + 1}`,
      title: `${category ?? "General"} trend breakout ${index + 1}`,
      channelName: `Channel ${index + 1}`,
      views: 25000 + index * 12000,
      likes: 1800 + index * 120,
      comments: 220 + index * 15,
      uploadedAt: new Date(now - (index + 2) * 6 * 60 * 60 * 1000).toISOString(),
      duration: 300,
      description: "Trending breakout video",
      tags: [category ?? "general", "trend", "breakout"],
      category: category ?? "all",
      thumbnail: "",
    }));
  } catch (error) {
    console.error("[Trend Research] Error fetching YouTube trends:", error);
    return [];
  }
}

export async function analyzeVideo(videoId: string): Promise<VideoAnalysis> {
  return {
    videoId,
    title: "",
    scriptFormula: "",
    keyScenes: [],
    audioPattern: "",
    visualStyle: "",
    engagementMetrics: { viewsPerDay: 0, likeRate: 0, commentRate: 0 },
    contentStrategy: "",
  };
}

export function extractScriptFormula(description: string): string {
  const patterns = {
    hook: description.substring(0, 50),
    body: description.substring(50, description.length - 50),
    cta: description.substring(description.length - 50),
  };
  return `Hook: "${patterns.hook}..." | Body: "${patterns.body}..." | CTA: "${patterns.cta}..."`;
}

export function extractHashtagsAndKeywords(title: string, description: string, tags?: string[]) {
  const hashtags = description.match(/#\w+/g) || [];
  const keywords = [...(tags || []), ...title.split(" ").filter((w) => w.length > 3)];
  return { hashtags: Array.from(new Set(hashtags)), keywords: Array.from(new Set(keywords)) };
}

export function calculateTrendMomentum(views: number, uploadedAt: string): TrendMomentum {
  const ageHours = Math.max(1, (Date.now() - new Date(uploadedAt).getTime()) / (1000 * 60 * 60));
  const viewsPerDay = views / Math.max(1, ageHours / 24);
  const freshnessScore = Math.max(0, Math.round(100 - ageHours * 2.5));
  const velocityScore = Math.min(100, Math.round(viewsPerDay / 500));
  const momentumScore = Math.round(freshnessScore * 0.45 + velocityScore * 0.55);
  return { viewsPerDay, freshnessScore, velocityScore, momentumScore, ageHours: Number(ageHours.toFixed(2)) };
}

export function analyzeContentPerformance(views: number, likes: number, comments: number, uploadedAt: string) {
  const momentum = calculateTrendMomentum(views, uploadedAt);
  const likeRate = views > 0 ? likes / views : 0;
  const commentRate = views > 0 ? comments / views : 0;
  const engagementScore = (likeRate + commentRate) * 100 + momentum.momentumScore * 0.1;
  return { viewsPerDay: momentum.viewsPerDay, likeRate, commentRate, engagementScore, momentum };
}

export function generateContentStrategy(trendingVideos: YouTubeTrendingVideo[], analyses: VideoAnalysis[]): string {
  const avgMomentum =
    trendingVideos.length > 0
      ? trendingVideos.reduce((sum, video) => sum + calculateTrendMomentum(video.views, video.uploadedAt).momentumScore, 0) / trendingVideos.length
      : 0;
  return `Average trend momentum ${avgMomentum.toFixed(1)} | formulas analyzed ${analyses.length}`;
}

export async function searchRelatedVideos(topic: string, maxResults: number = 5): Promise<YouTubeTrendingVideo[]> {
  return getYouTubeTrendingVideos(topic, maxResults);
}
