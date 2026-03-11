/**
 * Cost Tracking & Optimization Service
 * Tracks API costs and optimizes spending
 */

export interface ApiCost {
  id: string;
  videoId: string;
  service: string; // 'openai', 'claude', 'elevenlabs', 'creatomate', etc.
  operation: string; // 'hook_generation', 'script_writing', 'image_generation', etc.
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  duration: number; // milliseconds
  timestamp: Date;
  model?: string;
}

export interface CostSummary {
  totalCost: number;
  videosProcessed: number;
  costPerVideo: number;
  costByService: Record<string, number>;
  costByOperation: Record<string, number>;
  averageDuration: number;
  projectedMonthlyCost: number;
}

export interface OptimizationRecommendation {
  service: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
  recommendation: string;
  implementation: string;
}

/**
 * Define pricing for different services
 */
const PRICING = {
  openai: {
    "gpt-4": { input: 0.03 / 1000, output: 0.06 / 1000 },
    "gpt-3.5-turbo": { input: 0.0005 / 1000, output: 0.0015 / 1000 },
  },
  claude: {
    "claude-3-opus": { input: 0.015 / 1000, output: 0.075 / 1000 },
    "claude-3-sonnet": { input: 0.003 / 1000, output: 0.015 / 1000 },
    "claude-3-haiku": { input: 0.00025 / 1000, output: 0.00125 / 1000 },
  },
  together: {
    "meta-llama-70b": { input: 0.0001 / 1000, output: 0.0003 / 1000 },
  },
  elevenlabs: {
    standard: 0.00003, // per character
  },
  creatomate: {
    video_rendering: 1.0, // per video
  },
  mux: {
    video_analysis: 0.05, // per video
  },
};

/**
 * Calculate cost for API call
 */
export function calculateApiCost(
  service: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const serviceConfig = (PRICING as any)[service];
  if (!serviceConfig) return 0;

  const modelConfig = serviceConfig[model];
  if (!modelConfig) return 0;

  if (typeof modelConfig === "number") {
    // For character-based pricing (e.g., ElevenLabs)
    return inputTokens * modelConfig;
  }

  // For token-based pricing
  const inputCost = inputTokens * modelConfig.input;
  const outputCost = outputTokens * modelConfig.output;
  return inputCost + outputCost;
}

/**
 * Log API cost
 */
export async function logApiCost(cost: Omit<ApiCost, "id" | "timestamp">): Promise<ApiCost> {
  const apiCost: ApiCost = {
    ...cost,
    id: `cost-${Date.now()}`,
    timestamp: new Date(),
  };

  // In production, store in database
  // await db.insert('api_costs', apiCost);

  return apiCost;
}

/**
 * Get cost summary for a video
 */
export async function getVideoCostSummary(videoId: string): Promise<CostSummary> {
  // Mock implementation
  const costs = [
    { service: "openai", operation: "hook_generation", costUSD: 0.15 },
    { service: "openai", operation: "script_writing", costUSD: 0.25 },
    { service: "openai", operation: "scene_planning", costUSD: 0.10 },
    { service: "mux", operation: "image_generation", costUSD: 0.15 },
    { service: "elevenlabs", operation: "voice_generation", costUSD: 0.05 },
    { service: "creatomate", operation: "video_rendering", costUSD: 1.00 },
  ];

  const totalCost = costs.reduce((sum, c) => sum + c.costUSD, 0);

  const costByService: Record<string, number> = {};
  const costByOperation: Record<string, number> = {};

  for (const cost of costs) {
    costByService[cost.service] = (costByService[cost.service] || 0) + cost.costUSD;
    costByOperation[cost.operation] = (costByOperation[cost.operation] || 0) + cost.costUSD;
  }

  return {
    totalCost,
    videosProcessed: 1,
    costPerVideo: totalCost,
    costByService,
    costByOperation,
    averageDuration: 45000, // 45 seconds in milliseconds
    projectedMonthlyCost: totalCost * 30,
  };
}

/**
 * Get cost summary for a period
 */
export async function getCostSummaryByPeriod(
  startDate: Date,
  endDate: Date,
  channelId?: string
): Promise<CostSummary> {
  // Mock implementation
  const videosProcessed = 30;
  const totalCost = 52.5; // $1.75 per video × 30 videos

  return {
    totalCost,
    videosProcessed,
    costPerVideo: totalCost / videosProcessed,
    costByService: {
      openai: 21,
      mux: 4.5,
      elevenlabs: 1.5,
      creatomate: 30,
    },
    costByOperation: {
      hook_generation: 4.5,
      script_writing: 7.5,
      scene_planning: 3,
      image_generation: 4.5,
      voice_generation: 1.5,
      video_rendering: 30,
    },
    averageDuration: 45000,
    projectedMonthlyCost: totalCost * 30,
  };
}

/**
 * Get optimization recommendations
 */
export async function getOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
  return [
    {
      service: "openai",
      currentCost: 21,
      optimizedCost: 6,
      savings: 15,
      savingsPercentage: 71.4,
      recommendation: "Switch from GPT-4 to Claude Haiku for non-critical tasks",
      implementation:
        "Use Claude Haiku for metadata generation, fallback to GPT-4 for hooks/scripts",
    },
    {
      service: "batch_processing",
      currentCost: 21,
      optimizedCost: 6,
      savings: 15,
      savingsPercentage: 71.4,
      recommendation: "Implement batch processing to reduce API calls by 70%",
      implementation:
        "Combine 7 separate LLM calls into 1 batch call with structured output",
    },
    {
      service: "caching",
      currentCost: 52.5,
      optimizedCost: 31.5,
      savings: 21,
      savingsPercentage: 40,
      recommendation: "Cache LLM responses for common patterns",
      implementation:
        "Cache hook variations, topic suggestions, and SEO metadata for 1 week",
    },
    {
      service: "creatomate",
      currentCost: 30,
      optimizedCost: 15,
      savings: 15,
      savingsPercentage: 50,
      recommendation: "Use local video rendering for simple templates",
      implementation:
        "Use FFmpeg for simple renders, reserve Creatomate for complex animations",
    },
  ];
}

/**
 * Optimize API calls by batching
 */
export async function optimizeWithBatching(
  videoData: {
    title: string;
    topic: string;
    category: string;
    trendingHooks: string[];
  }
): Promise<{
  originalCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
  result: any;
}> {
  // Original: 7 separate API calls
  const originalCost = 0.7; // $0.70 for 7 calls

  // Optimized: 1 batch call
  const batchPrompt = `
    Analyze this video data and generate:
    1. 5 hook variations
    2. 3 topic suggestions
    3. Script outline
    4. Scene descriptions
    5. SEO metadata
    
    Title: ${videoData.title}
    Topic: ${videoData.topic}
    Category: ${videoData.category}
    Trending Hooks: ${videoData.trendingHooks.join(", ")}
  `;

  // Use cheaper model (Claude Haiku instead of GPT-4)
  const optimizedCost = 0.1; // $0.10 for 1 batch call with Claude Haiku

  return {
    originalCost,
    optimizedCost,
    savings: originalCost - optimizedCost,
    savingsPercentage: ((originalCost - optimizedCost) / originalCost) * 100,
    result: {
      hooks: ["Hook 1", "Hook 2", "Hook 3"],
      topics: ["Topic 1", "Topic 2"],
      script: "Script outline...",
      scenes: ["Scene 1", "Scene 2"],
      seo: { title: "SEO Title", tags: ["tag1", "tag2"] },
    },
  };
}

/**
 * Optimize with multi-model strategy
 */
export async function optimizeWithMultiModel(
  operation: string,
  complexity: "high" | "medium" | "low"
): Promise<{
  selectedModel: string;
  service: string;
  estimatedCost: number;
  reasoning: string;
}> {
  // High complexity: Use GPT-4 (best quality)
  if (complexity === "high") {
    return {
      selectedModel: "gpt-4",
      service: "openai",
      estimatedCost: 0.15,
      reasoning: "High complexity task requires best quality model",
    };
  }

  // Medium complexity: Use Claude Sonnet (good balance)
  if (complexity === "medium") {
    return {
      selectedModel: "claude-3-sonnet",
      service: "claude",
      estimatedCost: 0.05,
      reasoning: "Medium complexity task - good quality/cost balance",
    };
  }

  // Low complexity: Use Claude Haiku (cheapest)
  return {
    selectedModel: "claude-3-haiku",
    service: "claude",
    estimatedCost: 0.01,
    reasoning: "Low complexity task - use cheapest model",
  };
}

/**
 * Get cost breakdown by operation
 */
export async function getCostBreakdownByOperation(): Promise<
  Array<{
    operation: string;
    count: number;
    totalCost: number;
    averageCost: number;
    percentage: number;
  }>
> {
  return [
    {
      operation: "hook_generation",
      count: 30,
      totalCost: 4.5,
      averageCost: 0.15,
      percentage: 8.6,
    },
    {
      operation: "script_writing",
      count: 30,
      totalCost: 7.5,
      averageCost: 0.25,
      percentage: 14.3,
    },
    {
      operation: "scene_planning",
      count: 30,
      totalCost: 3,
      averageCost: 0.1,
      percentage: 5.7,
    },
    {
      operation: "image_generation",
      count: 90,
      totalCost: 4.5,
      averageCost: 0.05,
      percentage: 8.6,
    },
    {
      operation: "voice_generation",
      count: 30,
      totalCost: 1.5,
      averageCost: 0.05,
      percentage: 2.9,
    },
    {
      operation: "video_rendering",
      count: 30,
      totalCost: 30,
      averageCost: 1.0,
      percentage: 57.1,
    },
  ];
}

/**
 * Estimate cost for scaling
 */
export async function estimateScalingCost(videosPerDay: number): Promise<{
  videosPerDay: number;
  dailyCost: number;
  monthlyCost: number;
  yearlyCost: number;
  costPerVideo: number;
  withOptimization: {
    dailyCost: number;
    monthlyCost: number;
    yearlyCost: number;
    costPerVideo: number;
  };
}> {
  const costPerVideo = 1.75;
  const dailyCost = videosPerDay * costPerVideo;
  const monthlyCost = dailyCost * 30;
  const yearlyCost = monthlyCost * 12;

  // With optimization (77% reduction)
  const optimizedCostPerVideo = costPerVideo * 0.23;
  const optimizedDailyCost = videosPerDay * optimizedCostPerVideo;
  const optimizedMonthlyCost = optimizedDailyCost * 30;
  const optimizedYearlyCost = optimizedMonthlyCost * 12;

  return {
    videosPerDay,
    dailyCost,
    monthlyCost,
    yearlyCost,
    costPerVideo,
    withOptimization: {
      dailyCost: optimizedDailyCost,
      monthlyCost: optimizedMonthlyCost,
      yearlyCost: optimizedYearlyCost,
      costPerVideo: optimizedCostPerVideo,
    },
  };
}

/**
 * Get ROI analysis
 */
export async function getROIAnalysis(
  videosPerDay: number,
  avgViewsPerVideo: number,
  ctrPercentage: number,
  revenuePerClick: number
): Promise<{
  videosPerDay: number;
  dailyViews: number;
  dailyClicks: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  monthlyCost: number;
  monthlyProfit: number;
  roi: number;
}> {
  const dailyViews = videosPerDay * avgViewsPerVideo;
  const dailyClicks = dailyViews * (ctrPercentage / 100);
  const dailyRevenue = dailyClicks * revenuePerClick;
  const monthlyRevenue = dailyRevenue * 30;
  const monthlyCost = videosPerDay * 1.75 * 30;
  const monthlyProfit = monthlyRevenue - monthlyCost;
  const roi = (monthlyProfit / monthlyCost) * 100;

  return {
    videosPerDay,
    dailyViews,
    dailyClicks,
    dailyRevenue,
    monthlyRevenue,
    monthlyCost,
    monthlyProfit,
    roi,
  };
}
