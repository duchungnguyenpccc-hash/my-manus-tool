import { invokeLLM } from "../_core/llm";

/**
 * Enhanced Hook Generator Service
 * Generates high-performing hooks with multiple variations and strategies
 */

export interface HookVariation {
  hook: string;
  type: "curiosity" | "urgency" | "emotion" | "question" | "statement" | "pattern-interrupt";
  emotionTrigger: string;
  engagementScore: number;
  reasoning: string;
  bestFor: string;
}

export interface HookStrategy {
  strategy: string;
  description: string;
  examples: string[];
  effectiveness: number;
  bestNiches: string[];
}

export interface HookAnalysis {
  topic: string;
  hooks: HookVariation[];
  strategies: HookStrategy[];
  bestHook: HookVariation;
  scriptIntegration: string;
  timing: string;
}

/**
 * Generate multiple hook variations for a topic
 */
export async function generateHookVariations(
  topic: string,
  niche: string,
  count: number = 10
): Promise<HookVariation[]> {
  const prompt = `
Generate ${count} high-performing YouTube video hooks for the topic: "${topic}" in the "${niche}" niche.

Each hook should:
1. Be 5-15 seconds when read aloud
2. Trigger one of these emotions: curiosity, urgency, excitement, fear, surprise
3. Be unique and not overused in the niche
4. Have a clear call-to-action or promise
5. Be authentic and not clickbait

Hook types to include:
- Curiosity gap hooks (make viewer wonder)
- Urgency hooks (limited time/opportunity)
- Emotional hooks (connect emotionally)
- Question hooks (ask viewer directly)
- Statement hooks (bold claim)
- Pattern interrupt hooks (unexpected)

For each hook, provide:
1. The hook text (exactly as it would be spoken)
2. Type (curiosity/urgency/emotion/question/statement/pattern-interrupt)
3. Primary emotion trigger
4. Engagement score (0-100)
5. Reasoning why it works
6. Best use case

Return as JSON array:
[
  {
    "hook": "string",
    "type": "string",
    "emotionTrigger": "string",
    "engagementScore": number,
    "reasoning": "string",
    "bestFor": "string"
  }
]
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a YouTube hook expert who creates viral-worthy opening lines that maximize retention.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No hooks generated");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error("Error generating hook variations:", error);
    throw error;
  }
}

/**
 * Get hook strategies for a specific niche
 */
export async function getHookStrategies(niche: string): Promise<HookStrategy[]> {
  const prompt = `
Provide the top 5 hook strategies that work best for the "${niche}" niche on YouTube.

For each strategy, provide:
1. Strategy name
2. Detailed description
3. 3 concrete examples for "${niche}" topic
4. Effectiveness score (0-100)
5. Best niches where this works

Return as JSON array:
[
  {
    "strategy": "string",
    "description": "string",
    "examples": ["string"],
    "effectiveness": number,
    "bestNiches": ["string"]
  }
]
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a YouTube growth expert specializing in hook strategies.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No strategies generated");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error("Error getting hook strategies:", error);
    throw error;
  }
}

/**
 * Analyze and score hooks
 */
export async function analyzeHooks(
  hooks: string[],
  topic: string,
  niche: string
): Promise<HookVariation[]> {
  const prompt = `
Analyze and score these YouTube hooks for the topic "${topic}" in the "${niche}" niche:

Hooks to analyze:
${hooks.map((h, i) => `${i + 1}. "${h}"`).join("\n")}

For each hook, provide:
1. Hook text
2. Type (curiosity/urgency/emotion/question/statement/pattern-interrupt)
3. Primary emotion trigger
4. Engagement score (0-100)
5. Reasoning why it works or doesn't work
6. Best use case

Return as JSON array with same structure as hook variations.
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a YouTube hook analyst who evaluates hook quality and effectiveness.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No analysis generated");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error("Error analyzing hooks:", error);
    throw error;
  }
}

/**
 * Generate hook variations for A/B testing
 */
export async function generateHookABTestVariations(
  baseHook: string,
  topic: string,
  variationCount: number = 5
): Promise<HookVariation[]> {
  const prompt = `
Generate ${variationCount} A/B test variations of this hook:

Base Hook: "${baseHook}"
Topic: "${topic}"

Create variations that:
1. Keep the core concept but change the delivery
2. Test different emotion triggers
3. Test different hook types
4. Are distinct enough to measure impact
5. Are all authentic and not clickbait

For each variation, provide the same structure as hook variations.
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a YouTube A/B testing expert for hooks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No variations generated");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error("Error generating hook A/B test variations:", error);
    throw error;
  }
}

/**
 * Get complete hook analysis with strategies and variations
 */
export async function getCompleteHookAnalysis(
  topic: string,
  niche: string
): Promise<HookAnalysis> {
  try {
    const [hooks, strategies] = await Promise.all([
      generateHookVariations(topic, niche, 10),
      getHookStrategies(niche),
    ]);

    const bestHook = hooks.reduce((prev, current) =>
      prev.engagementScore > current.engagementScore ? prev : current
    );

    const scriptIntegration = `
Hook: "${bestHook.hook}"

Script Integration Tips:
1. Deliver with confidence and energy
2. Pause after the hook (2-3 seconds) to let it sink in
3. Use facial expressions that match the emotion
4. Keep eye contact with camera
5. Transition smoothly to the main content

Timing: Deliver the hook in the first 3-5 seconds of the video.
`;

    return {
      topic,
      hooks,
      strategies,
      bestHook,
      scriptIntegration,
      timing: "First 3-5 seconds of video",
    };
  } catch (error) {
    console.error("Error getting complete hook analysis:", error);
    throw error;
  }
}

/**
 * Generate hooks with competitor analysis
 */
export async function generateHooksWithCompetitorAnalysis(
  topic: string,
  niche: string,
  competitorChannels: string[]
): Promise<{
  hooks: HookVariation[];
  competitorInsights: string[];
  uniqueAngles: string[];
  recommendations: string[];
}> {
  const prompt = `
Generate hooks for "${topic}" in the "${niche}" niche, considering competitor analysis.

Competitor channels: ${competitorChannels.join(", ")}

Provide:
1. 10 hooks that are unique compared to competitors
2. Insights about what competitors are doing
3. Unique angles that competitors haven't explored
4. Recommendations for standing out

Return as JSON:
{
  "hooks": [
    {
      "hook": "string",
      "type": "string",
      "emotionTrigger": "string",
      "engagementScore": number,
      "reasoning": "string",
      "bestFor": "string"
    }
  ],
  "competitorInsights": ["string"],
  "uniqueAngles": ["string"],
  "recommendations": ["string"]
}
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a YouTube competitive analysis expert for hooks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No analysis generated");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error("Error generating hooks with competitor analysis:", error);
    throw error;
  }
}
