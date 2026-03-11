import { invokeLLM } from "../_core/llm";

/**
 * Thumbnail Optimizer Service
 * Generates optimized thumbnail designs with high CTR potential
 */

export interface ThumbnailDesign {
  title: string;
  description: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    textColor: string;
  };
  textSuggestions: string[];
  designElements: string[];
  emotionTriggers: string[];
  predictedCTR: number;
  reasoning: string;
}

export interface ThumbnailAnalysis {
  topic: string;
  niche: string;
  designs: ThumbnailDesign[];
  bestDesign: ThumbnailDesign;
  competitorInsights: string[];
  improvements: string[];
}

export interface CTRPrediction {
  baselineCTR: number;
  predictedCTR: number;
  improvement: number;
  confidenceScore: number;
  factors: {
    colorContrast: number;
    emotionalAppeal: number;
    textClarity: number;
    faceExpression: number;
    novelty: number;
  };
}

/**
 * Generate optimized thumbnail designs
 */
export async function generateThumbnailDesigns(
  topic: string,
  niche: string,
  count: number = 3
): Promise<ThumbnailDesign[]> {
  const prompt = `
You are a YouTube thumbnail design expert. Generate ${count} optimized thumbnail designs for a video about "${topic}" in the "${niche}" niche.

For each design, provide:
1. A compelling title for the thumbnail
2. Brief description of the design
3. Color scheme (primary, secondary, accent, text color) - use HEX codes
4. Text suggestions (max 3 words)
5. Design elements (face expression, objects, effects)
6. Emotion triggers (curiosity, fear, excitement, etc.)
7. Predicted CTR improvement (0-50%)
8. Reasoning for the design

Design principles:
- High contrast colors for mobile viewing
- Clear, readable text (max 3 words)
- Strong emotion triggers (curiosity gap, urgency, surprise)
- Face expressions when possible (proven to increase CTR)
- Avoid clutter and complexity
- Follow YouTube best practices

Return as JSON array with these exact fields:
[
  {
    "title": "string",
    "description": "string",
    "colorScheme": {
      "primary": "#HEX",
      "secondary": "#HEX",
      "accent": "#HEX",
      "textColor": "#HEX"
    },
    "textSuggestions": ["string"],
    "designElements": ["string"],
    "emotionTriggers": ["string"],
    "predictedCTR": number (0-50),
    "reasoning": "string"
  }
]
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a YouTube thumbnail design expert with deep knowledge of CTR optimization.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No designs generated");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error("Error generating thumbnail designs:", error);
    throw error;
  }
}

/**
 * Analyze competitor thumbnails and provide insights
 */
export async function analyzeCompetitorThumbnails(
  topic: string,
  niche: string,
  competitorChannels: string[]
): Promise<ThumbnailAnalysis> {
  const prompt = `
Analyze thumbnail design trends for the topic "${topic}" in the "${niche}" niche.

Competitor channels to consider: ${competitorChannels.join(", ")}

Provide:
1. 3 optimized thumbnail designs based on competitor analysis
2. Identify what works well in this niche
3. Suggest improvements over competitor designs
4. CTR predictions for each design

Return as JSON:
{
  "designs": [
    {
      "title": "string",
      "description": "string",
      "colorScheme": { ... },
      "textSuggestions": ["string"],
      "designElements": ["string"],
      "emotionTriggers": ["string"],
      "predictedCTR": number,
      "reasoning": "string"
    }
  ],
  "competitorInsights": ["string"],
  "improvements": ["string"]
}
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a YouTube thumbnail expert analyzing competitor designs.",
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
    const data = JSON.parse(contentStr);

    return {
      topic,
      niche,
      designs: data.designs || [],
      bestDesign: data.designs?.[0] || {},
      competitorInsights: data.competitorInsights || [],
      improvements: data.improvements || [],
    };
  } catch (error) {
    console.error("Error analyzing competitor thumbnails:", error);
    throw error;
  }
}

/**
 * Predict CTR for a thumbnail design
 */
export async function predictThumbnailCTR(
  design: ThumbnailDesign,
  baselineCTR: number = 4.5
): Promise<CTRPrediction> {
  const prompt = `
Predict the CTR (Click-Through Rate) for this YouTube thumbnail design:

Title: ${design.title}
Description: ${design.description}
Colors: Primary=${design.colorScheme.primary}, Secondary=${design.colorScheme.secondary}
Text: ${design.textSuggestions.join(", ")}
Elements: ${design.designElements.join(", ")}
Emotion Triggers: ${design.emotionTriggers.join(", ")}

Baseline CTR for this niche: ${baselineCTR}%

Provide:
1. Predicted CTR (0-20%)
2. Improvement over baseline (%)
3. Confidence score (0-100)
4. Factor scores for:
   - Color contrast (0-100)
   - Emotional appeal (0-100)
   - Text clarity (0-100)
   - Face expression effectiveness (0-100)
   - Novelty/uniqueness (0-100)

Return as JSON:
{
  "predictedCTR": number,
  "improvement": number,
  "confidenceScore": number,
  "factors": {
    "colorContrast": number,
    "emotionalAppeal": number,
    "textClarity": number,
    "faceExpression": number,
    "novelty": number
  }
}
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a YouTube CTR prediction expert.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No prediction generated");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const prediction = JSON.parse(contentStr);

    return {
      baselineCTR,
      predictedCTR: prediction.predictedCTR,
      improvement: prediction.improvement,
      confidenceScore: prediction.confidenceScore,
      factors: prediction.factors,
    };
  } catch (error) {
    console.error("Error predicting thumbnail CTR:", error);
    throw error;
  }
}

/**
 * Generate A/B test variations
 */
export async function generateABTestVariations(
  baseDesign: ThumbnailDesign,
  variationCount: number = 3
): Promise<ThumbnailDesign[]> {
  const prompt = `
Generate ${variationCount} A/B test variations of this thumbnail design:

Base Design:
- Title: ${baseDesign.title}
- Colors: ${JSON.stringify(baseDesign.colorScheme)}
- Text: ${baseDesign.textSuggestions.join(", ")}
- Elements: ${baseDesign.designElements.join(", ")}

Create variations that:
1. Keep the core concept but change specific elements
2. Test different color schemes
3. Test different text approaches
4. Test different emotional triggers
5. Are distinct enough to measure impact

Return as JSON array of ${variationCount} designs with same structure as base design.
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a YouTube A/B testing expert.",
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
    console.error("Error generating A/B test variations:", error);
    throw error;
  }
}

/**
 * Get design recommendations based on niche
 */
export async function getNicheDesignRecommendations(niche: string): Promise<{
  colorTrends: string[];
  textTrends: string[];
  elementTrends: string[];
  emotionTrends: string[];
  avoidPatterns: string[];
  bestPractices: string[];
}> {
  const prompt = `
Provide design recommendations for YouTube thumbnails in the "${niche}" niche.

Analyze:
1. Most effective color schemes
2. Text styles that work best
3. Design elements that perform well
4. Emotion triggers that resonate
5. Patterns to avoid
6. Best practices specific to this niche

Return as JSON:
{
  "colorTrends": ["string"],
  "textTrends": ["string"],
  "elementTrends": ["string"],
  "emotionTrends": ["string"],
  "avoidPatterns": ["string"],
  "bestPractices": ["string"]
}
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a YouTube thumbnail design expert with niche-specific knowledge.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No recommendations generated");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error("Error getting niche recommendations:", error);
    throw error;
  }
}
