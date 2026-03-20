import type { OptimizationProfileState } from "./objectiveEngine";

export type PatternRecord = {
  signature: string;
  topicType: string;
  titleStyle: string;
  hookType: string;
  nicheId: number;
  wins: number;
  losses: number;
  score: number;
  lastSeenAt: string;
};

export type PatternMatch = {
  signature: string;
  confidence: number;
  score: number;
  source: "winning" | "losing";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function detectTopicType(topic: string) {
  const normalized = topic.toLowerCase();
  if (normalized.includes("vs") || normalized.includes("compare")) return "comparison";
  if (normalized.includes("how to") || normalized.includes("guide")) return "tutorial";
  if (normalized.includes("mistake") || normalized.includes("avoid")) return "warning";
  if (normalized.includes("truth") || normalized.includes("secret")) return "reveal";
  return "explainer";
}

function detectTitleStyle(title: string) {
  const normalized = title.toLowerCase();
  if (/\d/.test(normalized)) return "numbered";
  if (normalized.includes("how to")) return "instructional";
  if (normalized.includes("why") || normalized.includes("what")) return "curiosity";
  if (normalized.includes("secret") || normalized.includes("hidden")) return "mystery";
  return "direct";
}

function detectHookType(text: string) {
  const normalized = text.toLowerCase();
  if (normalized.includes("before")) return "anticipation";
  if (normalized.includes("mistake") || normalized.includes("avoid")) return "fear";
  if (normalized.includes("secret") || normalized.includes("truth")) return "reveal";
  if (normalized.includes("fast") || normalized.includes("wins")) return "speed";
  return "educational";
}

function similarity(a: PatternRecord, b: PatternRecord, topic: string, title: string, hook: string) {
  const checks = [
    a.topicType === b.topicType ? 1 : 0,
    a.titleStyle === b.titleStyle ? 1 : 0,
    a.hookType === b.hookType ? 1 : 0,
  ];
  const sharedTerms = tokenize(`${topic} ${title} ${hook}`).filter((term) => a.signature.includes(term)).length;
  return clamp((checks.reduce((sum, value) => sum + value, 0) + Math.min(3, sharedTerms) / 3) / 4, 0, 1);
}

export const patternEngine = {
  buildPattern(input: { nicheId: number; topic: string; title?: string; hook?: string }): PatternRecord {
    const title = input.title ?? input.topic;
    const hook = input.hook ?? title;
    const topicType = detectTopicType(input.topic);
    const titleStyle = detectTitleStyle(title);
    const hookType = detectHookType(hook);
    const signature = `${input.nicheId}:${topicType}:${titleStyle}:${hookType}:${tokenize(`${input.topic} ${title}`).slice(0, 4).join("-")}`;

    return {
      signature,
      topicType,
      titleStyle,
      hookType,
      nicheId: input.nicheId,
      wins: 0,
      losses: 0,
      score: 0,
      lastSeenAt: new Date().toISOString(),
    };
  },

  scorePattern(input: { profile: OptimizationProfileState; nicheId: number; topic: string; title?: string; hook?: string }) {
    const probe = this.buildPattern(input);
    const winning = input.profile.winningPatterns
      .map((pattern) => ({ pattern, confidence: similarity(pattern, probe, input.topic, input.title ?? input.topic, input.hook ?? input.title ?? input.topic) }))
      .filter((item) => item.confidence >= 0.35)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
    const losing = input.profile.losingPatterns
      .map((pattern) => ({ pattern, confidence: similarity(pattern, probe, input.topic, input.title ?? input.topic, input.hook ?? input.title ?? input.topic) }))
      .filter((item) => item.confidence >= 0.35)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    const winningBoost = winning.reduce((sum, item) => sum + item.pattern.score * item.confidence, 0);
    const losingPenalty = losing.reduce((sum, item) => sum + Math.abs(item.pattern.score) * item.confidence, 0);

    return {
      pattern: probe,
      netScore: Number((winningBoost - losingPenalty).toFixed(3)),
      winningMatches: winning.map((item) => ({ signature: item.pattern.signature, confidence: item.confidence, score: item.pattern.score, source: "winning" as const })),
      losingMatches: losing.map((item) => ({ signature: item.pattern.signature, confidence: item.confidence, score: item.pattern.score, source: "losing" as const })),
    };
  },

  learnFromOutcome(input: { profile: OptimizationProfileState; nicheId: number; topic: string; title?: string; hook?: string; won: boolean; objectiveScore: number }) {
    const nextPattern = this.buildPattern(input);
    const targetList = input.won ? [...input.profile.winningPatterns] : [...input.profile.losingPatterns];
    const otherList = input.won ? [...input.profile.losingPatterns] : [...input.profile.winningPatterns];
    const index = targetList.findIndex((pattern) => pattern.signature === nextPattern.signature);

    if (index >= 0) {
      targetList[index] = {
        ...targetList[index],
        wins: targetList[index].wins + (input.won ? 1 : 0),
        losses: targetList[index].losses + (input.won ? 0 : 1),
        score: Number(clamp(targetList[index].score + (input.won ? 0.75 : -0.75), -10, 10).toFixed(3)),
        lastSeenAt: new Date().toISOString(),
      };
    } else {
      targetList.push({
        ...nextPattern,
        wins: input.won ? 1 : 0,
        losses: input.won ? 0 : 1,
        score: Number((input.won ? input.objectiveScore : -input.objectiveScore).toFixed(3)),
      });
    }

    const cleanedOtherList = otherList.filter((pattern) => pattern.signature !== nextPattern.signature);
    input.profile.winningPatterns = (input.won ? targetList : cleanedOtherList).sort((a, b) => b.score - a.score).slice(0, 40);
    input.profile.losingPatterns = (input.won ? cleanedOtherList : targetList).sort((a, b) => a.score - b.score).slice(0, 40);
    return input.profile;
  },
};
