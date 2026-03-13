import { generateVideoScript } from "../openaiService";
import type { ScriptProvider } from "./types";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

export const openAiScriptProvider: ScriptProvider = {
  id: "openai",
  mode: "cloud",
  async generateScript(input) {
    return generateVideoScript({
      topic: input.topic,
      sceneCount: input.sceneCount,
      videoDuration: input.videoDuration,
    });
  },
};

export const ollamaScriptProvider: ScriptProvider = {
  id: "ollama",
  mode: "local",
  async generateScript(input) {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.1",
        prompt: `Viết JSON kịch bản video về chủ đề '${input.topic}' với ${input.sceneCount} cảnh, tổng ${input.videoDuration} giây. Trả về format {title,description,voiceScript,scenes:[{title,imagePrompt}]}`,
        stream: false,
      }),
    });

    if (!response.ok) throw new Error(`Ollama script generation failed: ${response.status}`);
    const data = await response.json();

    try {
      return JSON.parse(data.response);
    } catch {
      return {
        title: input.topic,
        description: `Nội dung tự động bởi Ollama cho chủ đề ${input.topic}`,
        voiceScript: data.response,
        scenes: Array.from({ length: input.sceneCount }).map((_, i) => ({
          title: `Scene ${i + 1}`,
          imagePrompt: `${input.topic}, cinematic frame ${i + 1}`,
        })),
      };
    }
  },
};
