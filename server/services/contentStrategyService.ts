import { invokeLLM } from "../_core/llm";

/**
 * Content Strategy Service
 * Generates AI-powered content ideas, strategies, and recommendations
 */

export interface ContentIdea {
  topic: string;
  title: string;
  description: string;
  targetAudience: string;
  estimatedViews: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  relatedTopics: string[];
}

export interface ContentStrategy {
  mainTopic: string;
  ideas: ContentIdea[];
  contentCalendar: ContentCalendarEntry[];
  hashtagStrategy: string[];
  audienceAnalysis: AudienceAnalysis;
  competitorInsights: CompetitorInsight[];
  monetizationTips: string[];
}

export interface ContentCalendarEntry {
  date: string;
  topic: string;
  format: string;
  estimatedViews: number;
  priority: "low" | "medium" | "high";
}

export interface AudienceAnalysis {
  demographics: string;
  interests: string[];
  painPoints: string[];
  motivations: string[];
  preferredFormats: string[];
}

export interface CompetitorInsight {
  competitorName: string;
  strength: string;
  weakness: string;
  opportunity: string;
}

/**
 * Generate content ideas based on trends and analysis
 */
export async function generateContentIdeas(
  topic: string,
  trendingTopics: string[],
  audienceSize: number = 1000000
): Promise<ContentIdea[]> {
  const prompt = `
You are a content strategy expert. Generate 5 unique content ideas based on the main topic and trending topics.

Main Topic: ${topic}
Trending Topics: ${trendingTopics.join(", ")}
Target Audience Size: ${audienceSize.toLocaleString()}

For each idea, provide:
1. A specific video topic
2. An engaging title
3. A brief description
4. Target audience description
5. Estimated views (conservative estimate)
6. Difficulty level (easy/medium/hard)
7. Relevant tags
8. Related topics

Return as JSON array with these exact fields:
[
  {
    "topic": "string",
    "title": "string",
    "description": "string",
    "targetAudience": "string",
    "estimatedViews": number,
    "difficulty": "easy|medium|hard",
    "tags": ["string"],
    "relatedTopics": ["string"]
  }
]
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a content strategy expert who generates creative video ideas.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "content_ideas",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                topic: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                targetAudience: { type: "string" },
                estimatedViews: { type: "number" },
                difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                tags: { type: "array", items: { type: "string" } },
                relatedTopics: { type: "array", items: { type: "string" } },
              },
              required: ["topic", "title", "description", "targetAudience", "estimatedViews", "difficulty", "tags", "relatedTopics"],
              additionalProperties: false,
            },
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error("Error generating content ideas:", error);
    throw error;
  }
}

/**
 * Generate comprehensive content strategy
 */
export async function generateContentStrategy(
  mainTopic: string,
  trendingTopics: string[],
  competitorNames: string[]
): Promise<ContentStrategy> {
  const prompt = `
You are a professional content strategist. Create a comprehensive content strategy for a YouTube channel.

Main Topic: ${mainTopic}
Trending Topics: ${trendingTopics.join(", ")}
Competitors: ${competitorNames.join(", ")}

Generate:
1. 5 content ideas with titles, descriptions, and estimated views
2. A 30-day content calendar with topics and posting schedule
3. 20 relevant hashtags for the niche
4. Audience analysis (demographics, interests, pain points, motivations)
5. 3 competitor insights (strengths, weaknesses, opportunities)
6. 5 monetization tips specific to this niche

Return as JSON with these exact fields:
{
  "ideas": [
    {
      "topic": "string",
      "title": "string",
      "description": "string",
      "targetAudience": "string",
      "estimatedViews": number,
      "difficulty": "easy|medium|hard",
      "tags": ["string"],
      "relatedTopics": ["string"]
    }
  ],
  "contentCalendar": [
    {
      "date": "YYYY-MM-DD",
      "topic": "string",
      "format": "string",
      "estimatedViews": number,
      "priority": "low|medium|high"
    }
  ],
  "hashtags": ["string"],
  "audienceAnalysis": {
    "demographics": "string",
    "interests": ["string"],
    "painPoints": ["string"],
    "motivations": ["string"],
    "preferredFormats": ["string"]
  },
  "competitors": [
    {
      "name": "string",
      "strength": "string",
      "weakness": "string",
      "opportunity": "string"
    }
  ],
  "monetizationTips": ["string"]
}
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert content strategist with deep knowledge of YouTube and content creation.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No strategy generated");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const strategyData = JSON.parse(contentStr);

    return {
      mainTopic,
      ideas: strategyData.ideas || [],
      contentCalendar: strategyData.contentCalendar || [],
      hashtagStrategy: strategyData.hashtags || [],
      audienceAnalysis: strategyData.audienceAnalysis || {},
      competitorInsights: strategyData.competitors || [],
      monetizationTips: strategyData.monetizationTips || [],
    };
  } catch (error) {
    console.error("Error generating content strategy:", error);
    throw error;
  }
}

/**
 * Analyze audience for a specific niche
 */
export async function analyzeAudience(niche: string): Promise<AudienceAnalysis> {
  const prompt = `
Analyze the audience for the "${niche}" niche on YouTube.

Provide:
1. Demographics (age, gender, location, income)
2. Top 5 interests
3. Main pain points
4. Primary motivations
5. Preferred video formats

Return as JSON:
{
  "demographics": "string describing demographics",
  "interests": ["string"],
  "painPoints": ["string"],
  "motivations": ["string"],
  "preferredFormats": ["string"]
}
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an audience research expert.",
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
    console.error("Error analyzing audience:", error);
    throw error;
  }
}

/**
 * Generate hashtag strategy
 */
export async function generateHashtagStrategy(topic: string, niche: string): Promise<string[]> {
  const prompt = `
Generate 30 highly relevant hashtags for a YouTube video about "${topic}" in the "${niche}" niche.

Include:
- 5 high-volume hashtags (1M+ searches)
- 10 medium-volume hashtags (100K-1M searches)
- 15 low-volume hashtags (10K-100K searches)

Return as JSON array of strings:
["#hashtag1", "#hashtag2", ...]
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a YouTube SEO expert.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No hashtags generated");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error("Error generating hashtags:", error);
    throw error;
  }
}

/**
 * Predict video performance
 */
export async function predictVideoPerformance(
  topic: string,
  niche: string,
  channelSize: number
): Promise<{
  estimatedViews: number;
  estimatedEngagementRate: number;
  estimatedRevenue: number;
  confidenceScore: number;
}> {
  const prompt = `
Predict the performance of a YouTube video with these parameters:
- Topic: ${topic}
- Niche: ${niche}
- Channel Subscriber Count: ${channelSize.toLocaleString()}

Provide realistic estimates based on industry benchmarks:
1. Estimated views (first 30 days)
2. Estimated engagement rate (%)
3. Estimated revenue (CPM-based)
4. Confidence score (0-100)

Return as JSON:
{
  "estimatedViews": number,
  "estimatedEngagementRate": number,
  "estimatedRevenue": number,
  "confidenceScore": number
}
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a YouTube analytics expert with knowledge of industry benchmarks.",
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
    return JSON.parse(contentStr);
  } catch (error) {
    console.error("Error predicting video performance:", error);
    throw error;
  }
}

/**
 * Generate monetization recommendations
 */
export async function generateMonetizationRecommendations(niche: string): Promise<string[]> {
  const prompt = `
Generate 10 specific monetization strategies for a YouTube channel in the "${niche}" niche.

Include:
1. Ad revenue optimization tips
2. Sponsorship opportunities
3. Product/service recommendations
4. Affiliate marketing ideas
5. Community monetization strategies

Return as JSON array of strings with actionable recommendations:
["recommendation 1", "recommendation 2", ...]
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a YouTube monetization expert.",
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
    console.error("Error generating monetization recommendations:", error);
    throw error;
  }
}
