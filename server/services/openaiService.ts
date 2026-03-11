import { invokeLLM } from "../_core/llm";

export interface ScriptGenerationInput {
  topic: string;
  sceneCount: number;
  videoDuration: number; // in seconds
  language?: string;
}

export interface ScriptGenerationOutput {
  title: string;
  description: string;
  script: string;
  scenes: SceneScript[];
  voiceScript: string;
}

export interface SceneScript {
  sceneNumber: number;
  duration: number;
  narration: string;
  imagePrompts: string[];
}

/**
 * Generate a video script from a topic using OpenAI
 */
export async function generateVideoScript(input: ScriptGenerationInput): Promise<ScriptGenerationOutput> {
  const { topic, sceneCount, videoDuration, language = "English" } = input;

  const prompt = `You are an expert video scriptwriter specializing in creating engaging POV (Point of View) faceless videos for YouTube.

Topic: ${topic}
Number of Scenes: ${sceneCount}
Total Video Duration: ${videoDuration} seconds
Language: ${language}

Please create a compelling video script with the following structure:
1. A catchy title for the video
2. A brief description (2-3 sentences)
3. A complete script with ${sceneCount} scenes
4. For each scene: duration, narration, and 5 detailed image prompts

Requirements:
- Each scene should be ${Math.round(videoDuration / sceneCount)} seconds long
- The narration should be engaging and suitable for text-to-speech
- Image prompts should be highly detailed and specific for AI image generation
- Use vivid descriptions, colors, lighting, and composition details
- Ensure smooth transitions between scenes
- Make it suitable for a POV (first-person perspective) video style
- Include emotional hooks and storytelling elements

Format your response as a valid JSON object with this structure:
{
  "title": "Video Title",
  "description": "Brief description",
  "script": "Full script text",
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": ${Math.round(videoDuration / sceneCount)},
      "narration": "Scene narration text",
      "imagePrompts": [
        "Detailed prompt 1",
        "Detailed prompt 2",
        "Detailed prompt 3",
        "Detailed prompt 4",
        "Detailed prompt 5"
      ]
    }
  ],
  "voiceScript": "Combined narration for all scenes"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert video scriptwriter. Always respond with valid JSON. Do not include any markdown formatting or code blocks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "video_script",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              script: { type: "string" },
              scenes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sceneNumber: { type: "number" },
                    duration: { type: "number" },
                    narration: { type: "string" },
                    imagePrompts: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: ["sceneNumber", "duration", "narration", "imagePrompts"],
                  additionalProperties: false,
                },
              },
              voiceScript: { type: "string" },
            },
            required: ["title", "description", "script", "scenes", "voiceScript"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);
    return parsed as ScriptGenerationOutput;
  } catch (error) {
    console.error("[OpenAI] Failed to generate script:", error);
    throw new Error(`Failed to generate video script: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Enhance image prompts for better AI generation results
 */
export async function enhanceImagePrompts(prompts: string[]): Promise<string[]> {
  const promptList = prompts.join("\n");

  const enhancementPrompt = `You are an expert at crafting detailed, specific prompts for AI image generation models like Midjourney, DALL-E, or Stable Diffusion.

Original prompts:
${promptList}

Please enhance each prompt to be more detailed and specific. Focus on:
- Specific visual styles and artistic techniques
- Detailed descriptions of lighting, colors, and atmosphere
- Camera angles and composition
- Specific textures and materials
- Emotional tone and mood
- Any relevant artistic references

Return ONLY a JSON array of enhanced prompts, one for each original prompt. Do not include any other text.

Format: ["Enhanced prompt 1", "Enhanced prompt 2", ...]`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert prompt engineer for AI image generation. Always respond with valid JSON array only.",
        },
        {
          role: "user",
          content: enhancementPrompt,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from OpenAI");
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const enhanced = JSON.parse(jsonMatch[0]) as string[];
    return enhanced;
  } catch (error) {
    console.error("[OpenAI] Failed to enhance prompts:", error);
    // Return original prompts if enhancement fails
    return prompts;
  }
}

/**
 * Generate alternative titles and descriptions for a video
 */
export async function generateVideoMetadata(
  topic: string,
  script: string
): Promise<{ titles: string[]; descriptions: string[] }> {
  const prompt = `Based on this video topic and script, generate 5 catchy, SEO-friendly YouTube video titles and 5 engaging descriptions.

Topic: ${topic}

Script excerpt: ${script.substring(0, 500)}...

Return a JSON object with:
{
  "titles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
  "descriptions": ["Description 1", "Description 2", "Description 3", "Description 4", "Description 5"]
}

Make titles:
- 50-60 characters
- Include relevant keywords
- Use power words
- Include numbers or questions when appropriate

Make descriptions:
- 150-200 characters
- Include relevant keywords
- Include a call-to-action
- Mention the main benefit or hook`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert YouTube content strategist. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "video_metadata",
          strict: true,
          schema: {
            type: "object",
            properties: {
              titles: {
                type: "array",
                items: { type: "string" },
              },
              descriptions: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["titles", "descriptions"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content);
    return parsed;
  } catch (error) {
    console.error("[OpenAI] Failed to generate metadata:", error);
    throw new Error(`Failed to generate video metadata: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
