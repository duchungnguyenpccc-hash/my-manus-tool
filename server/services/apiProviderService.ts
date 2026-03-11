// API Provider Service - No database imports needed for this service

export interface APIProvider {
  id: string;
  name: string;
  type: "script" | "voice" | "image" | "video" | "music" | "trending";
  costPerUnit: number;
  unit: string;
  quality: number; // 1-10
  speed: number; // 1-10
  reliability: number; // 1-10
  isFree: boolean;
  requiresSetup: boolean;
  apiKey?: string;
  baseUrl?: string;
  notes: string;
}

export const AVAILABLE_PROVIDERS: Record<string, APIProvider[]> = {
  script: [
    {
      id: "openai",
      name: "OpenAI GPT-4",
      type: "script",
      costPerUnit: 0.03,
      unit: "1K tokens",
      quality: 10,
      speed: 8,
      reliability: 10,
      isFree: false,
      requiresSetup: true,
      notes: "Best quality, most expensive",
    },
    {
      id: "groq",
      name: "Groq (LLaMA 3)",
      type: "script",
      costPerUnit: 0.0001,
      unit: "1K tokens",
      quality: 8,
      speed: 10,
      reliability: 9,
      isFree: false,
      requiresSetup: true,
      notes: "Super fast, very cheap",
    },
    {
      id: "together-ai",
      name: "Together AI",
      type: "script",
      costPerUnit: 0.0005,
      unit: "1K tokens",
      quality: 8,
      speed: 9,
      reliability: 9,
      isFree: false,
      requiresSetup: true,
      notes: "Multiple models available",
    },
    {
      id: "ollama",
      name: "Ollama (Local LLaMA 2)",
      type: "script",
      costPerUnit: 0,
      unit: "unlimited",
      quality: 7,
      speed: 6,
      reliability: 8,
      isFree: true,
      requiresSetup: true,
      notes: "100% free, self-hosted",
    },
    {
      id: "huggingface",
      name: "Hugging Face Inference",
      type: "script",
      costPerUnit: 0,
      unit: "30K/month free",
      quality: 7,
      speed: 7,
      reliability: 8,
      isFree: true,
      requiresSetup: true,
      notes: "Free tier with limits",
    },
  ],
  voice: [
    {
      id: "elevenlabs",
      name: "ElevenLabs",
      type: "voice",
      costPerUnit: 0.003,
      unit: "1K characters",
      quality: 10,
      speed: 9,
      reliability: 10,
      isFree: false,
      requiresSetup: true,
      notes: "Best quality voices",
    },
    {
      id: "google-tts",
      name: "Google Cloud TTS",
      type: "voice",
      costPerUnit: 0.016,
      unit: "1K characters",
      quality: 9,
      speed: 8,
      reliability: 10,
      isFree: false,
      requiresSetup: true,
      notes: "220+ voices available",
    },
    {
      id: "azure-tts",
      name: "Azure Text-to-Speech",
      type: "voice",
      costPerUnit: 0.016,
      unit: "1K characters",
      quality: 9,
      speed: 8,
      reliability: 10,
      isFree: false,
      requiresSetup: true,
      notes: "Neural voices, enterprise",
    },
    {
      id: "edge-tts",
      name: "Edge TTS (Microsoft)",
      type: "voice",
      costPerUnit: 0,
      unit: "unlimited",
      quality: 8,
      speed: 9,
      reliability: 9,
      isFree: true,
      requiresSetup: false,
      notes: "100% free, 200+ voices",
    },
    {
      id: "pyttsx3",
      name: "pyttsx3 (Local)",
      type: "voice",
      costPerUnit: 0,
      unit: "unlimited",
      quality: 5,
      speed: 10,
      reliability: 9,
      isFree: true,
      requiresSetup: false,
      notes: "Offline, basic quality",
    },
  ],
  image: [
    {
      id: "creatomate",
      name: "Creatomate",
      type: "image",
      costPerUnit: 0.1,
      unit: "1 image",
      quality: 9,
      speed: 8,
      reliability: 9,
      isFree: false,
      requiresSetup: true,
      notes: "Professional templates",
    },
    {
      id: "replicate",
      name: "Replicate (SDXL)",
      type: "image",
      costPerUnit: 0.01,
      unit: "1 image",
      quality: 8,
      speed: 7,
      reliability: 9,
      isFree: false,
      requiresSetup: true,
      notes: "Multiple models available",
    },
    {
      id: "stability-ai",
      name: "Stability AI",
      type: "image",
      costPerUnit: 0.02,
      unit: "1 image",
      quality: 8,
      speed: 8,
      reliability: 9,
      isFree: false,
      requiresSetup: true,
      notes: "Fast, reliable",
    },
    {
      id: "stable-diffusion",
      name: "Stable Diffusion (Local)",
      type: "image",
      costPerUnit: 0,
      unit: "unlimited",
      quality: 7,
      speed: 5,
      reliability: 8,
      isFree: true,
      requiresSetup: true,
      notes: "100% free, self-hosted",
    },
    {
      id: "flux",
      name: "FLUX.1 (Local)",
      type: "image",
      costPerUnit: 0,
      unit: "unlimited",
      quality: 9,
      speed: 4,
      reliability: 8,
      isFree: true,
      requiresSetup: true,
      notes: "Latest, high quality",
    },
  ],
  video: [
    {
      id: "creatomate",
      name: "Creatomate",
      type: "video",
      costPerUnit: 0.5,
      unit: "1 minute",
      quality: 9,
      speed: 7,
      reliability: 9,
      isFree: false,
      requiresSetup: true,
      notes: "Professional rendering",
    },
    {
      id: "runway",
      name: "Runway ML",
      type: "video",
      costPerUnit: 0.05,
      unit: "1 second",
      quality: 8,
      speed: 6,
      reliability: 8,
      isFree: false,
      requiresSetup: true,
      notes: "AI video generation",
    },
    {
      id: "replicate",
      name: "Replicate (Video)",
      type: "video",
      costPerUnit: 0.05,
      unit: "1 second",
      quality: 7,
      speed: 7,
      reliability: 8,
      isFree: false,
      requiresSetup: true,
      notes: "Multiple video models",
    },
    {
      id: "ffmpeg",
      name: "FFmpeg (Local)",
      type: "video",
      costPerUnit: 0,
      unit: "unlimited",
      quality: 8,
      speed: 8,
      reliability: 9,
      isFree: true,
      requiresSetup: true,
      notes: "100% free, self-hosted",
    },
  ],
  music: [
    {
      id: "epidemic",
      name: "Epidemic Sound",
      type: "music",
      costPerUnit: 10,
      unit: "1 month",
      quality: 9,
      speed: 10,
      reliability: 10,
      isFree: false,
      requiresSetup: true,
      notes: "40K+ tracks, unlimited",
    },
    {
      id: "artlist",
      name: "Artlist",
      type: "music",
      costPerUnit: 14.99,
      unit: "1 month",
      quality: 9,
      speed: 10,
      reliability: 10,
      isFree: false,
      requiresSetup: true,
      notes: "50K+ tracks",
    },
    {
      id: "pexels",
      name: "Pexels Music",
      type: "music",
      costPerUnit: 0,
      unit: "unlimited",
      quality: 7,
      speed: 10,
      reliability: 9,
      isFree: true,
      requiresSetup: false,
      notes: "100% free, royalty-free",
    },
    {
      id: "pixabay",
      name: "Pixabay Music",
      type: "music",
      costPerUnit: 0,
      unit: "unlimited",
      quality: 7,
      speed: 10,
      reliability: 9,
      isFree: true,
      requiresSetup: false,
      notes: "100% free, 40K+ tracks",
    },
  ],
  trending: [
    {
      id: "youtube-api",
      name: "YouTube Data API",
      type: "trending",
      costPerUnit: 0,
      unit: "10K units/day",
      quality: 10,
      speed: 9,
      reliability: 10,
      isFree: true,
      requiresSetup: true,
      notes: "Official YouTube data",
    },
    {
      id: "google-trends",
      name: "Google Trends",
      type: "trending",
      costPerUnit: 0,
      unit: "unlimited",
      quality: 8,
      speed: 9,
      reliability: 9,
      isFree: true,
      requiresSetup: false,
      notes: "100% free, no API key",
    },
    {
      id: "tiktok-api",
      name: "TikTok API",
      type: "trending",
      costPerUnit: 0,
      unit: "limited",
      quality: 9,
      speed: 8,
      reliability: 7,
      isFree: true,
      requiresSetup: true,
      notes: "Limited access",
    },
  ],
};

export async function getProvidersByType(type: string): Promise<APIProvider[]> {
  return AVAILABLE_PROVIDERS[type] || [];
}

export async function calculateMonthlyCost(
  providers: Record<string, string>,
  videosPerDay: number = 10
): Promise<{
  totalCost: number;
  breakdown: Record<string, number>;
  savings: number;
}> {
  const breakdown: Record<string, number> = {};
  let totalCost = 0;
  let maxCost = 0;

  // Estimate costs based on provider selection
  const estimatedUnitsPerDay = {
    script: 5000, // tokens
    voice: 50000, // characters
    image: 10, // images
    video: 3600, // seconds (1 hour)
    music: 1, // per day
    trending: 100, // API calls
  };

  for (const [type, providerId] of Object.entries(providers)) {
    const provider = AVAILABLE_PROVIDERS[type]?.find((p) => p.id === providerId);
    if (!provider) continue;

    const unitsPerDay = estimatedUnitsPerDay[type as keyof typeof estimatedUnitsPerDay] || 1;
    const costPerDay = (unitsPerDay * provider.costPerUnit) / 1000; // Normalize to thousands
    const costPerMonth = costPerDay * 30;

    breakdown[type] = costPerMonth;
    totalCost += costPerMonth;

    // Calculate max cost if using paid options
    const paidProvider = AVAILABLE_PROVIDERS[type]?.find((p) => !p.isFree);
    if (paidProvider) {
      const maxCostPerDay = (unitsPerDay * paidProvider.costPerUnit) / 1000;
      maxCost += maxCostPerDay * 30;
    }
  }

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    breakdown,
    savings: Math.round((maxCost - totalCost) * 100) / 100,
  };
}

export async function getRecommendedProviders(budget: number): Promise<Record<string, string>> {
  const recommended: Record<string, string> = {};

  const types = ["script", "voice", "image", "video", "music", "trending"];
  let remainingBudget = budget;

  for (const type of types) {
    const providers = AVAILABLE_PROVIDERS[type] || [];

    // First, try free providers
    const freeProvider = providers.find((p) => p.isFree && p.quality >= 7);
    if (freeProvider) {
      recommended[type] = freeProvider.id;
      continue;
    }

    // If no free option, find cheapest within budget
    const sortedByPrice = providers.sort((a, b) => a.costPerUnit - b.costPerUnit);
    for (const provider of sortedByPrice) {
      if (provider.costPerUnit <= remainingBudget) {
        recommended[type] = provider.id;
        remainingBudget -= provider.costPerUnit;
        break;
      }
    }
  }

  return recommended;
}

export async function getProviderStats(providerId: string): Promise<{
  name: string;
  quality: number;
  speed: number;
  reliability: number;
  costPerUnit: number;
  isFree: boolean;
}> {
  for (const providers of Object.values(AVAILABLE_PROVIDERS)) {
    const provider = providers.find((p) => p.id === providerId);
    if (provider) {
      return {
        name: provider.name,
        quality: provider.quality,
        speed: provider.speed,
        reliability: provider.reliability,
        costPerUnit: provider.costPerUnit,
        isFree: provider.isFree,
      };
    }
  }

  throw new Error(`Provider ${providerId} not found`);
}

export async function compareProviders(
  type: string,
  providerIds: string[]
): Promise<
  Array<{
    id: string;
    name: string;
    quality: number;
    speed: number;
    reliability: number;
    cost: number;
    isFree: boolean;
  }>
> {
  const providers = AVAILABLE_PROVIDERS[type] || [];
  return providers
    .filter((p) => providerIds.includes(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      quality: p.quality,
      speed: p.speed,
      reliability: p.reliability,
      cost: p.costPerUnit,
      isFree: p.isFree,
    }));
}

export async function getOptimalProvider(
  type: string,
  priority: "cost" | "quality" | "speed" | "balanced" = "balanced"
): Promise<APIProvider | null> {
  const providers = AVAILABLE_PROVIDERS[type] || [];
  if (providers.length === 0) return null;

  let selected = providers[0];

  switch (priority) {
    case "cost":
      selected = providers.reduce((prev, current) =>
        current.costPerUnit < prev.costPerUnit ? current : prev
      );
      break;
    case "quality":
      selected = providers.reduce((prev, current) =>
        current.quality > prev.quality ? current : prev
      );
      break;
    case "speed":
      selected = providers.reduce((prev, current) =>
        current.speed > prev.speed ? current : prev
      );
      break;
    case "balanced":
      selected = providers.reduce((prev, current) => {
        const prevScore = (prev.quality + prev.speed + prev.reliability) / 3 - prev.costPerUnit * 100;
        const currentScore =
          (current.quality + current.speed + current.reliability) / 3 - current.costPerUnit * 100;
        return currentScore > prevScore ? current : prev;
      });
      break;
  }

  return selected;
}
