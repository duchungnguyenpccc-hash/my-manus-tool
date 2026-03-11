import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as apiProviderService from "../services/apiProviderService";

export const apiProviderRouter = router({
  // Get all providers for a specific type
  getByType: protectedProcedure
    .input(z.object({ type: z.string() }))
    .query(async ({ input }: any) => {
      const providers = await apiProviderService.getProvidersByType(input.type);
      return {
        success: true,
        providers,
        count: providers.length,
      };
    }),

  // Calculate monthly cost based on provider selection
  calculateCost: protectedProcedure
    .input(
      z.object({
        providers: z.record(z.string(), z.string()),
        videosPerDay: z.number().default(10),
      })
    )
    .query(async ({ input }: any) => {
      const result = await apiProviderService.calculateMonthlyCost(
        input.providers,
        input.videosPerDay
      );
      return {
        success: true,
        ...result,
      };
    }),

  // Get recommended providers based on budget
  getRecommended: protectedProcedure
    .input(z.object({ budget: z.number() }))
    .query(async ({ input }: any) => {
      const recommended = await apiProviderService.getRecommendedProviders(input.budget);
      return {
        success: true,
        recommended,
      };
    }),

  // Get provider statistics
  getStats: protectedProcedure
    .input(z.object({ providerId: z.string() }))
    .query(async ({ input }: any) => {
      const stats = await apiProviderService.getProviderStats(input.providerId);
      return {
        success: true,
        ...stats,
      };
    }),

  // Compare multiple providers
  compare: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        providerIds: z.array(z.string()),
      })
    )
    .query(async ({ input }: any) => {
      const comparison = await apiProviderService.compareProviders(input.type, input.providerIds);
      return {
        success: true,
        comparison,
      };
    }),

  // Get optimal provider based on priority
  getOptimal: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        priority: z.enum(["cost", "quality", "speed", "balanced"]).default("balanced"),
      })
    )
    .query(async ({ input }: any) => {
      const provider = await apiProviderService.getOptimalProvider(input.type, input.priority);
      return {
        success: true,
        provider,
      };
    }),

  // Get all available providers
  getAll: protectedProcedure.query(async () => {
      return {
        success: true,
        providers: apiProviderService.AVAILABLE_PROVIDERS,
      };
    }),

  // Get free providers only
  getFree: protectedProcedure.query(async () => {
      const freeProviders: Record<string, typeof apiProviderService.AVAILABLE_PROVIDERS[string]> = {};

      for (const [type, providers] of Object.entries(apiProviderService.AVAILABLE_PROVIDERS)) {
        freeProviders[type] = providers.filter((p) => p.isFree);
      }

      return {
        success: true,
        providers: freeProviders,
      };
    }),

  // Get cost comparison for all types
  getCostComparison: protectedProcedure.query(async () => {
      const comparison: Record<
        string,
        {
          free: number;
          cheapest: number;
          average: number;
          premium: number;
        }
      > = {};

      for (const [type, providers] of Object.entries(apiProviderService.AVAILABLE_PROVIDERS)) {
        const freeProviders = providers.filter((p) => p.isFree);
        const paidProviders = providers.filter((p) => !p.isFree);

        const freeCost = freeProviders.length > 0 ? 0 : 999999;
        const cheapest =
          paidProviders.length > 0 ? Math.min(...paidProviders.map((p) => p.costPerUnit)) : 0;
        const average =
          paidProviders.length > 0
            ? paidProviders.reduce((sum, p) => sum + p.costPerUnit, 0) / paidProviders.length
            : 0;
        const premium =
          paidProviders.length > 0 ? Math.max(...paidProviders.map((p) => p.costPerUnit)) : 0;

        comparison[type] = {
          free: freeCost,
          cheapest,
          average,
          premium,
        };
      }

      return {
        success: true,
        comparison,
      };
    }),

  // Get setup guide for a provider
  getSetupGuide: protectedProcedure
    .input(z.object({ providerId: z.string() }))
    .query(async ({ input }: any) => {
      const setupGuides: Record<string, string> = {
        ollama: "1. Download Ollama from ollama.ai\n2. Run: ollama pull llama2\n3. Start server: ollama serve\n4. Configure endpoint in settings",
        "edge-tts": "No setup required! Edge TTS works out of the box with no API key needed.",
        "stable-diffusion": "1. Install: pip install diffusers\n2. Download model\n3. Run locally or use ComfyUI\n4. Configure endpoint",
        ffmpeg: "1. Install FFmpeg: apt-get install ffmpeg\n2. Verify: ffmpeg -version\n3. Ready to use!",
        pexels: "1. Visit pexels.com/api\n2. Get free API key\n3. No credit card required\n4. 40K+ free tracks",
        "youtube-api": "1. Go to Google Cloud Console\n2. Enable YouTube Data API v3\n3. Create API key\n4. Add to settings",
        groq: "1. Sign up at groq.com\n2. Get API key\n3. Add to settings\n4. Start using (very fast!)",
        "google-tts": "1. Set up Google Cloud account\n2. Enable Cloud Text-to-Speech API\n3. Create service account\n4. Download JSON key",
        replicate: "1. Sign up at replicate.com\n2. Get API token\n3. Add to settings\n4. Choose model",
      };

      return {
        success: true,
        guide: setupGuides[input.providerId] || "Setup guide not available",
      };
    }),

  // Estimate monthly cost for different scenarios
  estimateScenarios: protectedProcedure.query(async () => {
      return {
        success: true,
        scenarios: {
          "100% Free": {
            script: "Ollama",
            voice: "Edge TTS",
            image: "Stable Diffusion",
            video: "FFmpeg",
            music: "Pexels",
            trending: "YouTube API",
            monthlyCost: 0,
            description: "All free, self-hosted",
          },
          "Budget ($50/month)": {
            script: "Groq",
            voice: "Edge TTS",
            image: "Stable Diffusion",
            video: "Replicate",
            music: "Pexels",
            trending: "YouTube API",
            monthlyCost: 50,
            description: "Mostly free with one paid service",
          },
          "Balanced ($150/month)": {
            script: "Together AI",
            voice: "Google Cloud TTS",
            image: "Replicate",
            video: "Runway",
            music: "Epidemic Sound",
            trending: "YouTube API",
            monthlyCost: 150,
            description: "Mix of free and affordable services",
          },
          "Premium ($500/month)": {
            script: "OpenAI",
            voice: "ElevenLabs",
            image: "Creatomate",
            video: "Creatomate",
            music: "Epidemic Sound",
            trending: "YouTube API",
            monthlyCost: 500,
            description: "Best quality, professional tools",
          },
        },
      };
    }),
});
