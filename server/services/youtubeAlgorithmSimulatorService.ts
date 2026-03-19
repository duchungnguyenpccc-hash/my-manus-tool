import axios from "axios";
import { getTrendingTopics, getYouTubeTrendingVideos } from "./trendResearchService";

export type ViralPrediction = {
  ctrScore: number;
  retentionScore: number;
  demandScore: number;
  competitionScore: number;
  viralScore: number;
  viralProbability: number;
  decision: "allow" | "reject";
  threshold: number;
  reasons: string[];
};

export type TopicScoreWeights = {
  ctr: number;
  retention: number;
  demand: number;
  competition: number;
};

export type RankedTopicCandidate = {
  topic: string;
  title: string;
  scores: {
    ctr: number;
    retention: number;
    demand: number;
    competition: number;
    viralProbability: number;
  };
  decision: "allow" | "reject";
  reasons: string[];
};

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

const EMOTIONAL_TRIGGERS = [
  "bí mật",
  "sốc",
  "không ngờ",
  "đơn giản",
  "nhanh",
  "miễn phí",
  "cực",
  "top",
  "best",
  "ultimate",
];

const CURIOSITY_PATTERNS = [/\?/, /\d+\s*(bí mật|cách|mẹo|tips)/i, /(ai cũng|không ai|you won't believe)/i];
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "to", "of", "for", "in", "on", "with", "how", "what", "why",
  "is", "are", "this", "that", "your", "you", "from", "into", "about", "best", "guide",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function jaccardSimilarity(a: string, b: string): number {
  const aSet = new Set(tokenize(a));
  const bSet = new Set(tokenize(b));
  if (aSet.size === 0 || bSet.size === 0) return 0;
  const intersection = Array.from(aSet).filter((token) => bSet.has(token)).length;
  const union = new Set(Array.from(aSet).concat(Array.from(bSet))).size;
  return intersection / union;
}

export function getSimulatorWeights(): TopicScoreWeights {
  return {
    ctr: Number(process.env.VIRAL_WEIGHT_CTR ?? 0.35),
    retention: Number(process.env.VIRAL_WEIGHT_RETENTION ?? 0.3),
    demand: Number(process.env.VIRAL_WEIGHT_DEMAND ?? 0.2),
    competition: Number(process.env.VIRAL_WEIGHT_COMPETITION ?? 0.15),
  };
}

export function predictTitleCTR(title: string): { score: number; reasons: string[] } {
  const t = title.toLowerCase().trim();
  let score = 30;
  const reasons: string[] = [];

  if (t.length >= 35 && t.length <= 75) {
    score += 20;
    reasons.push("Độ dài tiêu đề tối ưu cho CTR");
  }

  const emotionalHits = EMOTIONAL_TRIGGERS.filter((k) => t.includes(k)).length;
  score += emotionalHits * 6;
  if (emotionalHits > 0) reasons.push("Có emotional triggers");

  const curiosityHits = CURIOSITY_PATTERNS.filter((p) => p.test(t)).length;
  score += curiosityHits * 8;
  if (curiosityHits > 0) reasons.push("Có curiosity gap pattern");

  const keywordDensity = new Set(t.split(/\s+/).filter((w) => w.length > 3)).size;
  score += Math.min(20, Math.floor(keywordDensity / 2));

  return { score: clamp(score), reasons };
}

export function predictRetention(input: { hook?: string; structure?: string; topic: string }): { score: number; reasons: string[] } {
  let score = 35;
  const reasons: string[] = [];

  const hook = (input.hook || "").toLowerCase();
  if (hook.length >= 30) {
    score += 15;
    reasons.push("Hook đủ mạnh");
  }

  const structure = (input.structure || "").toLowerCase();
  if (structure.includes("hook") && structure.includes("cta")) {
    score += 15;
    reasons.push("Có cấu trúc Hook -> Body -> CTA");
  }

  const noveltyKeywords = ["2025", "mới", "update", "trend", "ai", "automation"];
  const noveltyHits = noveltyKeywords.filter((k) => input.topic.toLowerCase().includes(k)).length;
  score += noveltyHits * 5;
  if (noveltyHits > 0) reasons.push("Topic có novelty");

  return { score: clamp(score), reasons };
}

export async function predictDemand(topic: string): Promise<{ score: number; reasons: string[]; suggestions: string[] }> {
  let score = 25;
  const reasons: string[] = [];
  const suggestions: string[] = [];

  try {
    const suggest = await axios.get("https://suggestqueries.google.com/complete/search", {
      params: { client: "firefox", ds: "yt", q: topic },
      timeout: 8000,
    });

    const list = Array.isArray(suggest.data?.[1]) ? suggest.data[1] : [];
    suggestions.push(...list.slice(0, 10));
    score += Math.min(35, list.length * 4);
    if (list.length > 0) reasons.push("Có YouTube search suggestions");
  } catch {
    reasons.push("Không lấy được search suggestions, dùng fallback");
  }

  try {
    const trends = await getTrendingTopics("all", "en-US");
    const matched = trends.filter((t) => t.keyword.toLowerCase().includes(topic.toLowerCase())).length;
    score += Math.min(20, matched * 8);
    if (matched > 0) reasons.push("Topic khớp Google Trends");
  } catch {
    // noop
  }

  return { score: clamp(score), reasons, suggestions };
}

export async function predictCompetition(topic: string): Promise<{ score: number; reasons: string[] }> {
  const reasons: string[] = [];
  let score = 50;

  try {
    const videos = await getYouTubeTrendingVideos("all", 20);
    const topicWords = new Set(topic.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
    let competing = 0;
    let avgViews = 0;

    for (const v of videos) {
      const t = v.title.toLowerCase();
      const overlap = Array.from(topicWords).filter((w) => t.includes(w)).length;
      if (overlap >= 2) {
        competing++;
        avgViews += v.views;
      }
    }

    if (competing > 0) avgViews = avgViews / competing;

    // Competition score càng cao = càng dễ cạnh tranh
    score = clamp(80 - competing * 6 + (avgViews > 0 ? 10 : 0));
    reasons.push(`Competing videos: ${competing}`);
    if (avgViews > 0) reasons.push(`Avg competing views: ${Math.round(avgViews)}`);
  } catch {
    reasons.push("Không lấy được dữ liệu competition, dùng baseline");
    score = 50;
  }

  return { score, reasons };
}

export async function simulateViralPotential(input: {
  title: string;
  topic: string;
  hook?: string;
  structure?: string;
  threshold?: number;
}): Promise<ViralPrediction> {
  const threshold = input.threshold ?? Number(process.env.VIRAL_SCORE_THRESHOLD ?? 65);
  const weights = getSimulatorWeights();

  const ctr = predictTitleCTR(input.title || input.topic);
  const retention = predictRetention({ hook: input.hook, structure: input.structure, topic: input.topic });
  const demand = await predictDemand(input.topic);
  const competition = await predictCompetition(input.topic);

  const viralScore = clamp(
    ctr.score * weights.ctr +
      retention.score * weights.retention +
      demand.score * weights.demand +
      competition.score * weights.competition
  );

  const reasons = [...ctr.reasons, ...retention.reasons, ...demand.reasons, ...competition.reasons];

  return {
    ctrScore: Math.round(ctr.score),
    retentionScore: Math.round(retention.score),
    demandScore: Math.round(demand.score),
    competitionScore: Math.round(competition.score),
    viralScore: Math.round(viralScore),
    viralProbability: Math.round(viralScore),
    decision: viralScore >= threshold ? "allow" : "reject",
    threshold,
    reasons,
  };
}

export async function rankTopicsByViralPotential(input: {
  topics: Array<{ topic: string; title?: string; hook?: string; structure?: string }>;
  threshold?: number;
  topN?: number;
}): Promise<{
  threshold: number;
  topN: number;
  ranked: RankedTopicCandidate[];
  selected: RankedTopicCandidate[];
}> {
  const threshold = input.threshold ?? Number(process.env.VIRAL_SCORE_THRESHOLD ?? 65);
  const topN = input.topN ?? Number(process.env.VIRAL_GATE_TOP_N ?? 3);

  const ranked = await Promise.all(
    input.topics.map(async (candidate) => {
      const result = await simulateViralPotential({
        topic: candidate.topic,
        title: candidate.title ?? candidate.topic,
        hook: candidate.hook,
        structure: candidate.structure,
        threshold,
      });

      return {
        topic: candidate.topic,
        title: candidate.title ?? candidate.topic,
        scores: {
          ctr: result.ctrScore,
          retention: result.retentionScore,
          demand: result.demandScore,
          competition: result.competitionScore,
          viralProbability: result.viralProbability,
        },
        decision: result.decision,
        reasons: result.reasons,
      } satisfies RankedTopicCandidate;
    })
  );

  ranked.sort((a, b) => b.scores.viralProbability - a.scores.viralProbability);

  return {
    threshold,
    topN,
    ranked,
    selected: ranked.filter((item) => item.decision === "allow").slice(0, topN),
  };
}

export function calculateTopicNoveltyScore(topic: string, existingTopics: string[]): number {
  if (!existingTopics.length) return 90;
  const maxSimilarity = Math.max(...existingTopics.map((existing) => jaccardSimilarity(topic, existing)));
  return clamp(Math.round((1 - maxSimilarity) * 100));
}
