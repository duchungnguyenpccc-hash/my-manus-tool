import { and, eq } from "drizzle-orm";
import { optimizationProfiles } from "../../drizzle/schema";
import { getDb } from "../db";
import { patternEngine, type PatternRecord } from "./patternEngine";

export type ObjectiveWeights = {
  views: number;
  watchTime: number;
  revenue: number;
};

export type FactorWeights = {
  ctr: number;
  retention: number;
  demand: number;
};

export type PerformanceBaseline = {
  averageViews: number;
  averageWatchTimeMinutes: number;
  averageRevenue: number;
  averageCtr: number;
  averageRetention: number;
  averageObjectiveScore: number;
  samples: number;
};

export type BudgetPolicy = {
  roiMultiplier: number;
  targetCostPerVideo: number;
  estimatedRevenuePerVideo: number;
  lastKnownRoi: number;
  nichePriority: number;
};

export type ProductionPolicy = {
  videosPerDay: number;
  postingFrequency: number;
  replicationCount: number;
  explorationRate: number;
  contentStyle: "balanced" | "aggressive" | "experimental";
  preferredTopicType: string;
};

export type StrategyPreferences = {
  preferredTopicType: string;
  preferredTitleStyle: string;
  preferredHookType: string;
  systemConfidence: number;
};

export type OptimizationProfileState = {
  id?: number;
  userId: number;
  nicheId: number;
  objectiveWeights: ObjectiveWeights;
  factorWeights: FactorWeights;
  performanceBaseline: PerformanceBaseline;
  budgetPolicy: BudgetPolicy;
  productionPolicy: ProductionPolicy;
  winningPatterns: PatternRecord[];
  losingPatterns: PatternRecord[];
  strategyPreferences: StrategyPreferences;
  titlePatternScores: Record<string, number>;
  hookPatternScores: Record<string, number>;
  blacklistedPatterns: string[];
  autonomousMode: boolean;
  totalDecisions: number;
  wins: number;
  losses: number;
  lastLearningAt?: Date | null;
};

export type ObjectiveOutcomeInput = {
  userId: number;
  nicheId: number;
  topic: string;
  title?: string;
  hook?: string;
  metrics: {
    views: number;
    watchTimeMinutes: number;
    revenue: number;
    ctr: number;
    retention: number;
    costPerVideo?: number;
  };
  factorSignals?: Partial<Record<keyof FactorWeights, number>>;
};

const DEFAULT_OBJECTIVE_WEIGHTS: ObjectiveWeights = { views: 0.45, watchTime: 0.35, revenue: 0.2 };
const DEFAULT_FACTOR_WEIGHTS: FactorWeights = { ctr: 0.34, retention: 0.33, demand: 0.33 };
const DEFAULT_BASELINE: PerformanceBaseline = {
  averageViews: 7500,
  averageWatchTimeMinutes: 1200,
  averageRevenue: 125,
  averageCtr: 5,
  averageRetention: 48,
  averageObjectiveScore: 1,
  samples: 0,
};
const DEFAULT_BUDGET_POLICY: BudgetPolicy = {
  roiMultiplier: 1,
  targetCostPerVideo: 18,
  estimatedRevenuePerVideo: 125,
  lastKnownRoi: 1,
  nichePriority: 1,
};
const DEFAULT_PRODUCTION_POLICY: ProductionPolicy = {
  videosPerDay: 2,
  postingFrequency: 14,
  replicationCount: 20,
  explorationRate: 0.25,
  contentStyle: "balanced",
  preferredTopicType: "explainer",
};
const DEFAULT_STRATEGY_PREFERENCES: StrategyPreferences = {
  preferredTopicType: "explainer",
  preferredTitleStyle: "direct",
  preferredHookType: "educational",
  systemConfidence: 0.5,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeWeights<T extends Record<string, number>>(weights: T): T {
  const total = Object.values(weights).reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
  return Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, Math.max(0, value) / total])) as T;
}

function extractPatterns(text?: string) {
  if (!text) return [] as string[];
  const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((token) => token.length >= 4);
  const patterns = new Set(tokens);
  for (let index = 0; index < tokens.length - 1; index += 1) patterns.add(`${tokens[index]} ${tokens[index + 1]}`);
  return Array.from(patterns).slice(0, 12);
}

function averageNext(current: number, sample: number, samples: number) {
  return samples <= 0 ? sample : (current * samples + sample) / (samples + 1);
}

function inferContentStyle(profile: OptimizationProfileState): ProductionPolicy["contentStyle"] {
  if (profile.performanceBaseline.averageObjectiveScore >= 1.25 && profile.wins > profile.losses) return "aggressive";
  if (profile.performanceBaseline.averageObjectiveScore < 0.85) return "experimental";
  return "balanced";
}

export const objectiveEngine = {
  createDefaultProfile(userId: number, nicheId: number): OptimizationProfileState {
    return {
      userId,
      nicheId,
      objectiveWeights: { ...DEFAULT_OBJECTIVE_WEIGHTS },
      factorWeights: { ...DEFAULT_FACTOR_WEIGHTS },
      performanceBaseline: { ...DEFAULT_BASELINE },
      budgetPolicy: { ...DEFAULT_BUDGET_POLICY },
      productionPolicy: { ...DEFAULT_PRODUCTION_POLICY },
      winningPatterns: [],
      losingPatterns: [],
      strategyPreferences: { ...DEFAULT_STRATEGY_PREFERENCES },
      titlePatternScores: {},
      hookPatternScores: {},
      blacklistedPatterns: [],
      autonomousMode: true,
      totalDecisions: 0,
      wins: 0,
      losses: 0,
      lastLearningAt: null,
    };
  },

  async getProfile(userId: number, nicheId: number): Promise<OptimizationProfileState> {
    const fallback = this.createDefaultProfile(userId, nicheId);
    const db = await getDb();
    if (!db) return fallback;
    const rows = await db.select().from(optimizationProfiles).where(and(eq(optimizationProfiles.userId, userId), eq(optimizationProfiles.nicheId, nicheId))).limit(1);
    if (!rows[0]) return fallback;
    const row = rows[0];
    return {
      id: row.id,
      userId,
      nicheId,
      objectiveWeights: normalizeWeights({ ...DEFAULT_OBJECTIVE_WEIGHTS, ...((row.objectiveWeights ?? {}) as Record<string, number>) }),
      factorWeights: normalizeWeights({ ...DEFAULT_FACTOR_WEIGHTS, ...((row.factorWeights ?? {}) as Record<string, number>) }),
      performanceBaseline: { ...DEFAULT_BASELINE, ...((row.performanceBaseline ?? {}) as Record<string, number>) },
      budgetPolicy: { ...DEFAULT_BUDGET_POLICY, ...((row.budgetPolicy ?? {}) as Record<string, number>) },
      productionPolicy: { ...DEFAULT_PRODUCTION_POLICY, ...((row.productionPolicy ?? {}) as Record<string, unknown>) } as ProductionPolicy,
      winningPatterns: Array.isArray(row.winningPatterns) ? (row.winningPatterns as PatternRecord[]) : [],
      losingPatterns: Array.isArray(row.losingPatterns) ? (row.losingPatterns as PatternRecord[]) : [],
      strategyPreferences: { ...DEFAULT_STRATEGY_PREFERENCES, ...((row.strategyPreferences ?? {}) as Record<string, unknown>) } as StrategyPreferences,
      titlePatternScores: ((row.titlePatternScores ?? {}) as Record<string, number>) ?? {},
      hookPatternScores: ((row.hookPatternScores ?? {}) as Record<string, number>) ?? {},
      blacklistedPatterns: Array.isArray(row.blacklistedPatterns) ? (row.blacklistedPatterns as string[]) : [],
      autonomousMode: row.autonomousMode,
      totalDecisions: row.totalDecisions,
      wins: row.wins,
      losses: row.losses,
      lastLearningAt: row.lastLearningAt,
    };
  },

  async listProfilesByUser(userId: number) {
    const db = await getDb();
    if (!db) return [] as OptimizationProfileState[];
    const rows = await db.select().from(optimizationProfiles).where(eq(optimizationProfiles.userId, userId));
    return Promise.all(rows.map((row) => this.getProfile(row.userId, row.nicheId)));
  },

  async saveProfile(profile: OptimizationProfileState) {
    const db = await getDb();
    if (!db) return profile;
    const values = {
      userId: profile.userId,
      nicheId: profile.nicheId,
      objectiveWeights: profile.objectiveWeights,
      factorWeights: profile.factorWeights,
      performanceBaseline: profile.performanceBaseline,
      budgetPolicy: profile.budgetPolicy,
      productionPolicy: profile.productionPolicy,
      winningPatterns: profile.winningPatterns,
      losingPatterns: profile.losingPatterns,
      strategyPreferences: profile.strategyPreferences,
      titlePatternScores: profile.titlePatternScores,
      hookPatternScores: profile.hookPatternScores,
      blacklistedPatterns: profile.blacklistedPatterns,
      autonomousMode: profile.autonomousMode,
      totalDecisions: profile.totalDecisions,
      wins: profile.wins,
      losses: profile.losses,
      lastLearningAt: profile.lastLearningAt ?? new Date(),
    };
    if (profile.id) {
      await db.update(optimizationProfiles).set(values).where(eq(optimizationProfiles.id, profile.id));
      return profile;
    }
    const result: any = await db.insert(optimizationProfiles).values(values);
    profile.id = Number(result?.[0]?.insertId ?? result?.insertId ?? 0) || profile.id;
    return profile;
  },

  evaluateObjective(input: { metrics: ObjectiveOutcomeInput["metrics"]; baseline: PerformanceBaseline; objectiveWeights?: ObjectiveWeights }) {
    const weights = normalizeWeights(input.objectiveWeights ?? DEFAULT_OBJECTIVE_WEIGHTS);
    const viewLift = input.metrics.views / Math.max(1, input.baseline.averageViews);
    const watchLift = input.metrics.watchTimeMinutes / Math.max(1, input.baseline.averageWatchTimeMinutes);
    const revenueLift = input.metrics.revenue / Math.max(1, input.baseline.averageRevenue);
    const objectiveScore = viewLift * weights.views + watchLift * weights.watchTime + revenueLift * weights.revenue;
    return {
      objectiveScore: Number(objectiveScore.toFixed(3)),
      normalized: {
        views: Number(viewLift.toFixed(3)),
        watchTime: Number(watchLift.toFixed(3)),
        revenue: Number(revenueLift.toFixed(3)),
      },
      status: objectiveScore >= Math.max(1.05, input.baseline.averageObjectiveScore * 0.98) ? "WIN" as const : "FAIL" as const,
    };
  },

  applyReinforcement(profile: OptimizationProfileState, factorSignals: Partial<Record<keyof FactorWeights, number>>, won: boolean) {
    const delta = won ? 0.06 : -0.05;
    const next = { ...profile.factorWeights };
    (Object.keys(profile.factorWeights) as Array<keyof FactorWeights>).forEach((key) => {
      const contribution = clamp(factorSignals[key] ?? 0, 0, 1);
      next[key] = Math.max(0.1, next[key] + delta * Math.max(0.25, contribution));
    });
    profile.factorWeights = normalizeWeights(next);
    return profile.factorWeights;
  },

  updatePatternScores(scoreMap: Record<string, number>, text: string | undefined, delta: number) {
    for (const pattern of extractPatterns(text)) scoreMap[pattern] = Number(clamp((scoreMap[pattern] ?? 0) + delta, -5, 10).toFixed(3));
    return scoreMap;
  },

  updateBlacklist(profile: OptimizationProfileState, topic: string, won: boolean) {
    const penalties: Record<string, number> = {};
    for (const [key, value] of Object.entries(profile.hookPatternScores)) if (key.startsWith("__kill__:")) penalties[key.replace("__kill__:", "")] = value;
    for (const pattern of extractPatterns(topic)) penalties[pattern] = (penalties[pattern] ?? 0) + (won ? -1 : 1.25);
    for (const [pattern, value] of Object.entries(penalties)) profile.hookPatternScores[`__kill__:${pattern}`] = Number(clamp(value, 0, 5).toFixed(3));
    profile.blacklistedPatterns = Object.entries(penalties).filter(([, score]) => score >= 2.5).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([pattern]) => pattern);
    return profile.blacklistedPatterns;
  },

  updateProductionPolicy(profile: OptimizationProfileState, won: boolean) {
    const current = profile.productionPolicy;
    const roi = profile.budgetPolicy.lastKnownRoi;
    profile.productionPolicy = {
      videosPerDay: clamp(current.videosPerDay + (won ? 1 : -0.5) + (roi > 1.4 ? 1 : 0), 1, 12),
      postingFrequency: Math.round(clamp(current.postingFrequency + (won ? 2 : -1), 3, 45)),
      replicationCount: Math.round(clamp(current.replicationCount + (won ? 10 : -4), 10, 50)),
      explorationRate: Number(clamp(current.explorationRate + (won ? -0.03 : 0.04), 0.05, 0.5).toFixed(2)),
      contentStyle: inferContentStyle(profile),
      preferredTopicType: profile.strategyPreferences.preferredTopicType,
    };
    return profile.productionPolicy;
  },

  async rebalancePortfolio(userId: number) {
    const profiles = await this.listProfilesByUser(userId);
    if (!profiles.length) return [];
    const avgObjective = profiles.reduce((sum, profile) => sum + profile.performanceBaseline.averageObjectiveScore, 0) / profiles.length;
    const avgRoi = profiles.reduce((sum, profile) => sum + profile.budgetPolicy.lastKnownRoi, 0) / profiles.length;

    for (const profile of profiles) {
      const performanceBias = profile.performanceBaseline.averageObjectiveScore - avgObjective;
      const roiBias = profile.budgetPolicy.lastKnownRoi - avgRoi;
      profile.budgetPolicy.nichePriority = Number(clamp(1 + performanceBias + roiBias * 0.5, 0.4, 3).toFixed(3));
      if (profile.budgetPolicy.nichePriority < 0.85) {
        profile.productionPolicy.videosPerDay = clamp(profile.productionPolicy.videosPerDay - 1, 1, 12);
        profile.productionPolicy.explorationRate = Number(clamp(profile.productionPolicy.explorationRate + 0.08, 0.05, 0.5).toFixed(2));
      }
      if (profile.budgetPolicy.nichePriority > 1.2) {
        profile.productionPolicy.videosPerDay = clamp(profile.productionPolicy.videosPerDay + 1, 1, 12);
        profile.productionPolicy.replicationCount = Math.round(clamp(profile.productionPolicy.replicationCount + 5, 10, 50));
      }
      await this.saveProfile(profile);
    }

    return profiles;
  },

  async recordOutcome(input: ObjectiveOutcomeInput) {
    const profile = await this.getProfile(input.userId, input.nicheId);
    const evaluation = this.evaluateObjective({ metrics: input.metrics, baseline: profile.performanceBaseline, objectiveWeights: profile.objectiveWeights });
    const won = evaluation.status === "WIN";
    const samples = profile.performanceBaseline.samples;
    const costPerVideo = input.metrics.costPerVideo ?? profile.budgetPolicy.targetCostPerVideo;
    const roi = input.metrics.revenue / Math.max(1, costPerVideo);

    profile.totalDecisions += 1;
    profile.wins += won ? 1 : 0;
    profile.losses += won ? 0 : 1;
    profile.lastLearningAt = new Date();
    profile.performanceBaseline = {
      averageViews: Number(averageNext(profile.performanceBaseline.averageViews, input.metrics.views, samples).toFixed(2)),
      averageWatchTimeMinutes: Number(averageNext(profile.performanceBaseline.averageWatchTimeMinutes, input.metrics.watchTimeMinutes, samples).toFixed(2)),
      averageRevenue: Number(averageNext(profile.performanceBaseline.averageRevenue, input.metrics.revenue, samples).toFixed(2)),
      averageCtr: Number(averageNext(profile.performanceBaseline.averageCtr, input.metrics.ctr, samples).toFixed(2)),
      averageRetention: Number(averageNext(profile.performanceBaseline.averageRetention, input.metrics.retention, samples).toFixed(2)),
      averageObjectiveScore: Number(averageNext(profile.performanceBaseline.averageObjectiveScore, evaluation.objectiveScore, samples).toFixed(3)),
      samples: samples + 1,
    };

    this.applyReinforcement(profile, input.factorSignals ?? { ctr: input.metrics.ctr / 10, retention: input.metrics.retention / 100, demand: evaluation.normalized.views / 2 }, won);
    this.updatePatternScores(profile.titlePatternScores, input.title, won ? 0.7 : -0.5);
    this.updatePatternScores(profile.hookPatternScores, input.hook ?? input.topic, won ? 0.5 : -0.45);
    this.updateBlacklist(profile, input.topic, won);
    patternEngine.learnFromOutcome({ profile, nicheId: input.nicheId, topic: input.topic, title: input.title, hook: input.hook, won, objectiveScore: evaluation.objectiveScore });

    const bestWinningPattern = profile.winningPatterns[0];
    if (bestWinningPattern) {
      profile.strategyPreferences = {
        preferredTopicType: bestWinningPattern.topicType,
        preferredTitleStyle: bestWinningPattern.titleStyle,
        preferredHookType: bestWinningPattern.hookType,
        systemConfidence: Number(clamp(profile.strategyPreferences.systemConfidence + (won ? 0.05 : -0.03), 0.1, 0.95).toFixed(3)),
      };
    }

    profile.budgetPolicy = {
      roiMultiplier: Number(clamp(profile.budgetPolicy.roiMultiplier + (won ? 0.15 : -0.08), 0.5, 3).toFixed(2)),
      targetCostPerVideo: Number(clamp(costPerVideo * (won ? 1.08 : 0.92), 5, 250).toFixed(2)),
      estimatedRevenuePerVideo: Number(averageNext(profile.budgetPolicy.estimatedRevenuePerVideo, input.metrics.revenue, samples).toFixed(2)),
      lastKnownRoi: Number(roi.toFixed(3)),
      nichePriority: Number(clamp(profile.budgetPolicy.nichePriority + (won ? 0.08 : -0.06), 0.4, 3).toFixed(3)),
    };

    this.updateProductionPolicy(profile, won);
    await this.saveProfile(profile);
    await this.rebalancePortfolio(input.userId);

    return { ...evaluation, profile, roi: Number(roi.toFixed(3)) };
  },
};
