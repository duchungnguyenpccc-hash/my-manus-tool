import { invokeLLM } from "../_core/llm";

export interface ModerationResult {
  approved: boolean;
  score: number; // 0-1, higher = more problematic
  categories: {
    violence: boolean;
    sexual: boolean;
    hateful: boolean;
    harassment: boolean;
    selfHarm: boolean;
    illegal: boolean;
    other: boolean;
  };
  reasons: string[];
  suggestions: string[];
}

/**
 * Content Moderation Service
 * Validates video content for appropriateness using OpenAI Moderation API
 */
export class ContentModerationService {
  /**
   * Moderate single text content
   */
  static async moderateContent(content: string): Promise<ModerationResult> {
    if (!content.trim()) {
      throw new Error("Content is required");
    }

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a content moderation expert. Analyze the given content and determine if it's appropriate for YouTube.
Consider factors like:
- Violence or graphic content
- Sexual or adult content
- Hateful speech or discrimination
- Harassment or bullying
- Self-harm or suicide references
- Illegal activities
- Misinformation or harmful false claims

Return a JSON response with moderation results.`,
          },
          {
            role: "user",
            content: `Moderate this video topic/script:

"${content}"

Provide a JSON response with:
{
  "approved": boolean (true if content is appropriate for YouTube),
  "score": number (0-1, higher = more problematic),
  "categories": {
    "violence": boolean,
    "sexual": boolean,
    "hateful": boolean,
    "harassment": boolean,
    "selfHarm": boolean,
    "illegal": boolean,
    "other": boolean
  },
  "reasons": ["reason1", "reason2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "content_moderation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                approved: { type: "boolean" },
                score: { type: "number", minimum: 0, maximum: 1 },
                categories: {
                  type: "object",
                  properties: {
                    violence: { type: "boolean" },
                    sexual: { type: "boolean" },
                    hateful: { type: "boolean" },
                    harassment: { type: "boolean" },
                    selfHarm: { type: "boolean" },
                    illegal: { type: "boolean" },
                    other: { type: "boolean" },
                  },
                  required: [
                    "violence",
                    "sexual",
                    "hateful",
                    "harassment",
                    "selfHarm",
                    "illegal",
                    "other",
                  ],
                  additionalProperties: false,
                },
                reasons: {
                  type: "array",
                  items: { type: "string" },
                },
                suggestions: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["approved", "score", "categories", "reasons", "suggestions"],
              additionalProperties: false,
            },
          },
        },
      });

      const content_resp = response.choices[0]?.message.content;
      if (!content_resp) {
        throw new Error("No response from OpenAI");
      }

      const contentStr =
        typeof content_resp === "string" ? content_resp : JSON.stringify(content_resp);
      const result = JSON.parse(contentStr) as ModerationResult;

      // Validate result
      if (typeof result.approved !== "boolean" || typeof result.score !== "number") {
        throw new Error("Invalid moderation response");
      }

      return result;
    } catch (error) {
      console.error("Content moderation error:", error);
      throw error;
    }
  }

  /**
   * Moderate multiple contents
   */
  static async moderateMultiple(
    contents: string[]
  ): Promise<ModerationResult[]> {
    if (!Array.isArray(contents) || contents.length === 0) {
      throw new Error("Contents array is required");
    }

    if (contents.length > 20) {
      throw new Error("Maximum 20 contents can be moderated at once");
    }

    try {
      const results = await Promise.all(
        contents.map((content) => this.moderateContent(content))
      );
      return results;
    } catch (error) {
      console.error("Batch moderation error:", error);
      throw error;
    }
  }

  /**
   * Check if content passes moderation
   */
  static async isContentApproved(content: string): Promise<boolean> {
    const result = await this.moderateContent(content);
    return result.approved;
  }

  /**
   * Get moderation score (0-1)
   */
  static async getModerationScore(content: string): Promise<number> {
    const result = await this.moderateContent(content);
    return result.score;
  }

  /**
   * Get moderation report
   */
  static async getModerationReport(content: string): Promise<string> {
    const result = await this.moderateContent(content);

    const flaggedCategories = Object.entries(result.categories)
      .filter(([, value]) => value)
      .map(([key]) => key);

    let report = `Content Moderation Report\n`;
    report += `Status: ${result.approved ? "✅ APPROVED" : "❌ REJECTED"}\n`;
    report += `Risk Score: ${(result.score * 100).toFixed(1)}%\n`;

    if (flaggedCategories.length > 0) {
      report += `\nFlagged Categories:\n`;
      flaggedCategories.forEach((cat) => {
        report += `  - ${cat}\n`;
      });
    }

    if (result.reasons.length > 0) {
      report += `\nReasons:\n`;
      result.reasons.forEach((reason) => {
        report += `  - ${reason}\n`;
      });
    }

    if (result.suggestions.length > 0) {
      report += `\nSuggestions:\n`;
      result.suggestions.forEach((suggestion) => {
        report += `  - ${suggestion}\n`;
      });
    }

    return report;
  }
}
