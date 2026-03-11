/**
 * ElevenLabs Text-to-Speech Service
 * Converts text to natural-sounding speech with voice customization
 */

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

export type VoicePreset = "adam" | "bella" | "charlie" | "dorothy" | "emily" | "ethan" | "george" | "grace";

export interface VoiceSettings {
  stability?: number; // 0-1, default 0.5
  similarityBoost?: number; // 0-1, default 0.75
}

export interface TextToSpeechInput {
  text: string;
  voiceId?: string;
  voicePreset?: VoicePreset;
  modelId?: string;
  settings?: VoiceSettings;
}

export interface VoiceInfo {
  voiceId: string;
  name: string;
  category: string;
  description: string;
}

/**
 * Get list of available voices
 */
export async function getVoices(apiKey: string): Promise<VoiceInfo[]> {
  const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
    headers: {
      "xi-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { voices: VoiceInfo[] };
  return data.voices;
}

/**
 * Get voice details
 */
export async function getVoiceDetails(apiKey: string, voiceId: string): Promise<VoiceInfo> {
  const response = await fetch(`${ELEVENLABS_BASE_URL}/voices/${voiceId}`, {
    headers: {
      "xi-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as VoiceInfo;
  return data;
}

/**
 * Get preset voice ID by name
 */
export function getPresetVoiceId(preset: VoicePreset): string {
  const voiceMap: Record<VoicePreset, string> = {
    adam: "pNInz6obpgDQGcFmaJqB",
    bella: "EXAVITQu4vr4xnSDxMaL",
    charlie: "IZSifFFhzhzhBBXNDAbw",
    dorothy: "ThT5KcBeYPX3keUQqHcH",
    emily: "LJ1OUsmbnFUDyDBRXnCY",
    ethan: "g5CIjZEefAQLP1BQnXzJ",
    george: "JBFqnCBsd6RMkjW5OWP1",
    grace: "oWAxZDx7w5VEj9dCyTzz",
  };

  return voiceMap[preset];
}

/**
 * Convert text to speech
 */
export async function textToSpeech(
  apiKey: string,
  input: TextToSpeechInput
): Promise<Buffer> {
  const voiceId = input.voiceId || getPresetVoiceId(input.voicePreset || "bella");
  const modelId = input.modelId || "eleven_monolingual_v1";

  const payload = {
    text: input.text,
    model_id: modelId,
    voice_settings: {
      stability: input.settings?.stability ?? 0.5,
      similarity_boost: input.settings?.similarityBoost ?? 0.75,
    },
  };

  const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs error: ${response.status} - ${error}`);
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

/**
 * Convert text to speech with streaming
 */
export async function textToSpeechStream(
  apiKey: string,
  input: TextToSpeechInput
): Promise<ReadableStream<Uint8Array>> {
  const voiceId = input.voiceId || getPresetVoiceId(input.voicePreset || "bella");
  const modelId = input.modelId || "eleven_monolingual_v1";

  const payload = {
    text: input.text,
    model_id: modelId,
    voice_settings: {
      stability: input.settings?.stability ?? 0.5,
      similarity_boost: input.settings?.similarityBoost ?? 0.75,
    },
  };

  const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}/stream`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs error: ${response.status} - ${error}`);
  }

  return response.body as ReadableStream<Uint8Array>;
}

/**
 * Generate speech from multiple text segments
 */
export async function generateMultiSegmentAudio(
  apiKey: string,
  segments: Array<{
    text: string;
    voicePreset?: VoicePreset;
    settings?: VoiceSettings;
  }>
): Promise<Buffer[]> {
  const audioBuffers: Buffer[] = [];

  for (const segment of segments) {
    const audio = await textToSpeech(apiKey, {
      text: segment.text,
      voiceId: segment.voicePreset ? getPresetVoiceId(segment.voicePreset) : "",
      voicePreset: segment.voicePreset,
      settings: segment.settings,
    });

    audioBuffers.push(audio);
  }

  return audioBuffers;
}

/**
 * Combine multiple audio buffers into one
 * Note: This is a simple concatenation. For proper audio merging, use ffmpeg
 */
export function combineAudioBuffers(buffers: Buffer[]): Buffer {
  return Buffer.concat(buffers);
}

/**
 * Get character count for text (for quota checking)
 */
export function getCharacterCount(text: string): number {
  return text.length;
}

/**
 * Estimate audio duration in seconds (rough estimate)
 */
export function estimateAudioDuration(text: string): number {
  // Average speaking rate: ~150 words per minute
  // Average word length: ~5 characters
  const words = text.length / 5;
  const minutesPerWord = 1 / 150;
  const seconds = words * minutesPerWord * 60;
  return Math.ceil(seconds);
}

/**
 * Validate API key by checking quota
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/user`, {
      headers: {
        "xi-api-key": apiKey,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get user subscription info
 */
export async function getUserInfo(apiKey: string): Promise<any> {
  const response = await fetch(`${ELEVENLABS_BASE_URL}/user`, {
    headers: {
      "xi-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs error: ${response.status} - ${error}`);
  }

  return response.json();
}
