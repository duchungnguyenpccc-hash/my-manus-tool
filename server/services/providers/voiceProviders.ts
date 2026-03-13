import { textToSpeech } from "../elevenLabsService";
import { getApiKey } from "../../utils/apiKeyDb";
import type { VoiceGenerationProvider } from "./types";

const COQUI_TTS_URL = process.env.COQUI_TTS_URL || "http://127.0.0.1:5002";

export const elevenLabsVoiceProvider: VoiceGenerationProvider = {
  id: "elevenlabs",
  mode: "cloud",
  async generateVoice(input) {
    const key = await getApiKey(input.userId, "elevenlabs");
    if (!key) throw new Error("ElevenLabs API key not configured");
    return textToSpeech(key, {
      text: input.text,
      voicePreset: (input.voicePreset as any) || "bella",
    });
  },
};

export const coquiVoiceProvider: VoiceGenerationProvider = {
  id: "coqui-tts",
  mode: "local",
  async generateVoice(input) {
    const response = await fetch(`${COQUI_TTS_URL}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input.text, speaker: input.voicePreset || "default" }),
    });

    if (!response.ok) throw new Error(`Coqui TTS failed: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  },
};
