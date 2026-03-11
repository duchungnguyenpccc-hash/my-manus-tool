import { invokeLLM } from "../_core/llm";

export interface TitleGenerationResult {
  mainTitle: string;
  shortTitle: string;
  seoTitle: string;
  description: string;
  tags: string[];
  keywords: string[];
}

/**
 * Title Generation Service
 * Generates SEO-optimized titles and descriptions for video content
 */
export class TitleGenerationService {
  /**
   * Generate titles and metadata from topic
   */
  static async generateTitles(topic: string): Promise<TitleGenerationResult> {
    if (!topic.trim()) {
      throw new Error("Topic is required");
    }

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional video content strategist and SEO expert. 
Your task is to generate compelling, SEO-optimized titles and metadata for YouTube videos.
Focus on:
- Catchy, engaging main titles (50-60 characters)
- Short titles for thumbnails (20-30 characters)
- SEO-optimized titles with keywords (60-70 characters)
- Compelling descriptions (150-200 characters)
- Relevant tags and keywords for YouTube algorithm
- High click-through rate potential
- Audience engagement

Return response in JSON format.`,
          },
          {
            role: "user",
            content: `Generate titles and metadata for a video about: "${topic}"

Return a JSON object with this structure:
{
  "mainTitle": "Main title for YouTube (50-60 chars)",
  "shortTitle": "Short title for thumbnail (20-30 chars)",
  "seoTitle": "SEO-optimized title with keywords (60-70 chars)",
  "description": "Compelling description (150-200 chars)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "title_generation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                mainTitle: {
                  type: "string",
                  description: "Main title for YouTube",
                },
                shortTitle: {
                  type: "string",
                  description: "Short title for thumbnail",
                },
                seoTitle: {
                  type: "string",
                  description: "SEO-optimized title",
                },
                description: {
                  type: "string",
                  description: "Video description",
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "YouTube tags",
                },
                keywords: {
                  type: "array",
                  items: { type: "string" },
                  description: "SEO keywords",
                },
              },
              required: [
                "mainTitle",
                "shortTitle",
                "seoTitle",
                "description",
                "tags",
                "keywords",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const contentStr = typeof content === "string" ? content : JSON.stringify(content);
      const result = JSON.parse(contentStr) as TitleGenerationResult;

      // Validate result
      if (
        !result.mainTitle ||
        !result.shortTitle ||
        !result.seoTitle ||
        !result.description
      ) {
        throw new Error("Invalid title generation response");
      }

      return result;
    } catch (error) {
      console.error("Title generation error:", error);
      throw error;
    }
  }

  /**
   * Generate multiple title variations
   */
  static async generateTitleVariations(
    topic: string,
    count: number = 3
  ): Promise<TitleGenerationResult[]> {
    if (!topic.trim()) {
      throw new Error("Topic is required");
    }

    if (count < 1 || count > 10) {
      throw new Error("Count must be between 1 and 10");
    }

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional video content strategist and SEO expert.
Generate multiple variations of titles and metadata for YouTube videos.
Each variation should have a different angle or approach to maximize reach.
Focus on diversity in style while maintaining quality and SEO optimization.`,
          },
          {
            role: "user",
            content: `Generate ${count} different title variations and metadata for a video about: "${topic}"

Return a JSON array with ${count} objects, each with this structure:
[
  {
    "mainTitle": "Main title variation 1",
    "shortTitle": "Short title 1",
    "seoTitle": "SEO title 1",
    "description": "Description 1",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "keywords": ["keyword1", "keyword2", "keyword3"]
  },
  ...
]

Make each variation unique with different angles, hooks, or approaches.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "title_variations",
            strict: true,
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  mainTitle: { type: "string" },
                  shortTitle: { type: "string" },
                  seoTitle: { type: "string" },
                  description: { type: "string" },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                  },
                  keywords: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: [
                  "mainTitle",
                  "shortTitle",
                  "seoTitle",
                  "description",
                  "tags",
                  "keywords",
                ],
                additionalProperties: false,
              },
            },
          },
        },
      });

      const content = response.choices[0]?.message.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const contentStr = typeof content === "string" ? content : JSON.stringify(content);
      const results = JSON.parse(contentStr) as TitleGenerationResult[];

      if (!Array.isArray(results) || results.length === 0) {
        throw new Error("Invalid title variations response");
      }

      return results.slice(0, count);
    } catch (error) {
      console.error("Title variations generation error:", error);
      throw error;
    }
  }

  /**
   * Optimize title for specific platform
   */
  static async optimizeTitleForPlatform(
    title: string,
    platform: "youtube" | "tiktok" | "instagram" | "twitter"
  ): Promise<string> {
    if (!title.trim()) {
      throw new Error("Title is required");
    }

    const platformGuidelines: Record<string, string> = {
      youtube: "60 characters, include keywords, use power words, add numbers",
      tiktok: "Catchy, trendy, under 150 characters, use hashtags",
      instagram: "Engaging, visual-focused, under 150 characters",
      twitter: "Concise, under 280 characters, include relevant hashtags",
    };

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a social media marketing expert. 
Optimize titles for different platforms while maintaining the core message.`,
          },
          {
            role: "user",
            content: `Optimize this title for ${platform}: "${title}"

Platform guidelines: ${platformGuidelines[platform]}

Return only the optimized title, nothing else.`,
          },
        ],
      });

      const content = response.choices[0]?.message.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const contentStr = typeof content === "string" ? content : JSON.stringify(content);
      return contentStr.trim();
    } catch (error) {
      console.error("Title optimization error:", error);
      throw error;
    }
  }
}
