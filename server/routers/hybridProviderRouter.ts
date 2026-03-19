import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { providerManagerService } from "../services/providerManagerService";
import { execFile } from "child_process";

function execFileAsync(cmd: string, args: string[]) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(cmd, args, (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve({ stdout, stderr });
    });
  });
}

const tools = [
  { id: "ollama", check: ["ollama", ["--version"]] as const, install: "curl -fsSL https://ollama.com/install.sh | sh" },
  { id: "stable-diffusion", check: ["python3", ["-c", "import torch; print('ok')"]] as const, install: "pip install diffusers transformers accelerate" },
  { id: "ffmpeg", check: ["ffmpeg", ["-version"]] as const, install: "sudo apt-get update && sudo apt-get install -y ffmpeg" },
  { id: "whisper", check: ["python3", ["-c", "import whisper; print('ok')"]] as const, install: "pip install -U openai-whisper" },
  { id: "coqui-tts", check: ["python3", ["-c", "import TTS; print('ok')"]] as const, install: "pip install TTS" },
];

export const hybridProviderRouter = router({
  catalog: protectedProcedure.query(async () => {
    return providerManagerService.getProviderCatalog();
  }),

  getConfigs: protectedProcedure.query(async ({ ctx }) => {
    return providerManagerService.getProviderConfigs(ctx.user.id);
  }),

  upsertConfig: protectedProcedure
    .input(
      z.object({
        category: z.enum(["script", "image", "voice", "render"]),
        mode: z.enum(["cloud", "local"]),
        providerId: z.string().min(1),
        settings: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return providerManagerService.upsertProviderConfig({
        userId: ctx.user.id,
        category: input.category,
        mode: input.mode,
        providerId: input.providerId,
        settings: input.settings,
      });
    }),

  detectLocalTools: protectedProcedure.query(async () => {
    const result = [] as Array<{ id: string; installed: boolean; message: string }>;

    for (const tool of tools) {
      try {
        const out = await execFileAsync(tool.check[0], [...tool.check[1]]);
        result.push({ id: tool.id, installed: true, message: (out.stdout || out.stderr || "ok").slice(0, 240) });
      } catch (error) {
        result.push({ id: tool.id, installed: false, message: error instanceof Error ? error.message : String(error) });
      }
    }

    return result;
  }),

  installToolInstructions: protectedProcedure
    .input(z.object({ toolId: z.string() }))
    .mutation(async ({ input }) => {
      const tool = tools.find((t) => t.id === input.toolId);
      if (!tool) throw new Error("Tool not supported");
      return {
        toolId: tool.id,
        installCommand: tool.install,
      };
    }),
});
