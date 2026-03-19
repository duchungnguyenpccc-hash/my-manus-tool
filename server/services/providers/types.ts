export type ProviderMode = "cloud" | "local";
export type ProviderCategory = "script" | "image" | "voice" | "render";

export type ProviderConfig = {
  mode: ProviderMode;
  providerId: string;
  settings?: Record<string, unknown>;
};

export interface ScriptProvider {
  id: string;
  mode: ProviderMode;
  generateScript(input: {
    userId: number;
    topic: string;
    sceneCount: number;
    videoDuration: number;
    nichePrompt?: string;
  }): Promise<any>;
}

export interface ImageGenerationProvider {
  id: string;
  mode: ProviderMode;
  generateImage(input: {
    userId: number;
    prompt: string;
    model?: string;
  }): Promise<{ url: string }>;
}

export interface VoiceGenerationProvider {
  id: string;
  mode: ProviderMode;
  generateVoice(input: {
    userId: number;
    text: string;
    voicePreset?: string;
  }): Promise<Buffer>;
}

export interface RenderProvider {
  id: string;
  mode: ProviderMode;
  render(input: {
    userId: number;
    videoClips: Array<{ url: string; duration?: number; index?: number }>;
    audioUrl: string;
    textOverlays?: Array<Record<string, unknown>>;
  }): Promise<{ url: string }>;
}
