import { and, eq } from "drizzle-orm";
import { providerConfigurations } from "../../drizzle/schema";
import { getDb } from "../db";
import type {
  ImageGenerationProvider,
  ProviderCategory,
  ProviderConfig,
  RenderProvider,
  ScriptProvider,
  VoiceGenerationProvider,
} from "./providers/types";
import { openAiScriptProvider, ollamaScriptProvider } from "./providers/scriptProviders";
import { midjourneyImageProvider, stableDiffusionImageProvider } from "./providers/imageProviders";
import { elevenLabsVoiceProvider, coquiVoiceProvider } from "./providers/voiceProviders";
import { creatomateRenderProvider, ffmpegRenderProvider } from "./providers/renderProviders";

const scriptProviders: ScriptProvider[] = [openAiScriptProvider, ollamaScriptProvider];
const imageProviders: ImageGenerationProvider[] = [midjourneyImageProvider, stableDiffusionImageProvider];
const voiceProviders: VoiceGenerationProvider[] = [elevenLabsVoiceProvider, coquiVoiceProvider];
const renderProviders: RenderProvider[] = [creatomateRenderProvider, ffmpegRenderProvider];

const defaults: Record<ProviderCategory, ProviderConfig> = {
  script: { mode: "cloud", providerId: "openai" },
  image: { mode: "cloud", providerId: "midjourney" },
  voice: { mode: "cloud", providerId: "elevenlabs" },
  render: { mode: "cloud", providerId: "creatomate" },
};

async function getUserProviderConfig(userId: number, category: ProviderCategory): Promise<ProviderConfig> {
  const db = await getDb();
  if (!db) return defaults[category];

  const row = await db
    .select()
    .from(providerConfigurations)
    .where(
      and(
        eq(providerConfigurations.userId, userId),
        eq(providerConfigurations.category, category),
        eq(providerConfigurations.isActive, true)
      )
    )
    .limit(1);

  if (!row.length) return defaults[category];
  return {
    mode: row[0].mode,
    providerId: row[0].providerId,
    settings: (row[0].settings ?? {}) as Record<string, unknown>,
  };
}

export const providerManagerService = {
  async upsertProviderConfig(input: {
    userId: number;
    category: ProviderCategory;
    mode: "cloud" | "local";
    providerId: string;
    settings?: Record<string, unknown>;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const existing = await db
      .select()
      .from(providerConfigurations)
      .where(and(eq(providerConfigurations.userId, input.userId), eq(providerConfigurations.category, input.category)))
      .limit(1);

    if (existing.length) {
      await db
        .update(providerConfigurations)
        .set({
          mode: input.mode,
          providerId: input.providerId,
          settings: input.settings ?? {},
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(providerConfigurations.id, existing[0].id));
    } else {
      await db.insert(providerConfigurations).values({
        userId: input.userId,
        category: input.category,
        mode: input.mode,
        providerId: input.providerId,
        settings: input.settings ?? {},
        isActive: true,
      });
    }

    return { success: true };
  },

  async getProviderConfigs(userId: number) {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(providerConfigurations).where(eq(providerConfigurations.userId, userId));
  },

  async generateScript(params: {
    userId: number;
    topic: string;
    sceneCount: number;
    videoDuration: number;
    nichePrompt?: string;
  }) {
    const config = await getUserProviderConfig(params.userId, "script");
    const provider = scriptProviders.find((p) => p.id === config.providerId) ?? openAiScriptProvider;
    return provider.generateScript(params);
  },

  async generateImage(params: { userId: number; prompt: string; model?: string }) {
    const config = await getUserProviderConfig(params.userId, "image");
    const provider = imageProviders.find((p) => p.id === config.providerId) ?? midjourneyImageProvider;
    return provider.generateImage(params);
  },

  async generateVoice(params: { userId: number; text: string; voicePreset?: string }) {
    const config = await getUserProviderConfig(params.userId, "voice");
    const provider = voiceProviders.find((p) => p.id === config.providerId) ?? elevenLabsVoiceProvider;
    return provider.generateVoice(params);
  },

  async renderVideo(params: {
    userId: number;
    videoClips: Array<{ url: string; duration?: number; index?: number }>;
    audioUrl: string;
    textOverlays?: Array<Record<string, unknown>>;
  }) {
    const config = await getUserProviderConfig(params.userId, "render");
    const provider = renderProviders.find((p) => p.id === config.providerId) ?? creatomateRenderProvider;
    return provider.render(params);
  },

  getProviderCatalog() {
    return {
      script: scriptProviders.map((p) => ({ id: p.id, mode: p.mode })),
      image: imageProviders.map((p) => ({ id: p.id, mode: p.mode })),
      voice: voiceProviders.map((p) => ({ id: p.id, mode: p.mode })),
      render: renderProviders.map((p) => ({ id: p.id, mode: p.mode })),
    };
  },
};
