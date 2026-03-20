import { searchRelatedVideos } from "./trendResearchService";

export type CompetitionInsight = {
  topic: string;
  averageViews: number;
  averageChannelSize: number;
  uploadFrequencyPerWeek: number;
  competitionScore: number;
  difficulty: "low" | "medium" | "high";
  timingScore: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function estimateChannelSize(views: number, index: number) {
  return Math.round(views * (1.4 + index * 0.08));
}

export const competitionEngine = {
  async analyzeTopic(topic: string): Promise<CompetitionInsight> {
    const videos = await searchRelatedVideos(topic, 6);
    if (!videos.length) {
      return {
        topic,
        averageViews: 0,
        averageChannelSize: 0,
        uploadFrequencyPerWeek: 0,
        competitionScore: 35,
        difficulty: "low",
        timingScore: 70,
      };
    }

    const now = Date.now();
    const averageViews = Math.round(videos.reduce((sum, video) => sum + video.views, 0) / videos.length);
    const averageChannelSize = Math.round(
      videos.reduce((sum, video, index) => sum + estimateChannelSize(video.views, index), 0) / videos.length
    );
    const uploadsLastWeek = videos.filter((video) => now - new Date(video.uploadedAt).getTime() <= 7 * 24 * 60 * 60 * 1000).length;
    const uploadFrequencyPerWeek = Number((uploadsLastWeek / Math.max(1, videos.length / 2)).toFixed(2));
    const averageAgeHours =
      videos.reduce((sum, video) => sum + (now - new Date(video.uploadedAt).getTime()) / (1000 * 60 * 60), 0) /
      videos.length;
    const timingScore = Math.round(clamp(100 - averageAgeHours * 1.8, 5, 100));
    const rawCompetition = averageViews / 25000 + averageChannelSize / 200000 + uploadFrequencyPerWeek * 8;
    const competitionScore = Math.round(clamp(rawCompetition * 18, 5, 100));
    const difficulty = competitionScore >= 70 ? "high" : competitionScore >= 45 ? "medium" : "low";

    return {
      topic,
      averageViews,
      averageChannelSize,
      uploadFrequencyPerWeek,
      competitionScore,
      difficulty,
      timingScore,
    };
  },
};
