import { generateImage } from "../piapiService";
import type { ImageGenerationProvider } from "./types";

const STABLE_DIFFUSION_URL = process.env.STABLE_DIFFUSION_URL || "http://127.0.0.1:7860";

export const midjourneyImageProvider: ImageGenerationProvider = {
  id: "midjourney",
  mode: "cloud",
  async generateImage(input) {
    // Tạm dùng pipeline PiAPI hiện có để giữ tương thích.
    const result: any = await generateImage(String(input.userId), input.prompt, {
      model: "qwen",
    });
    return { url: result?.url || result?.imageUrl || "" };
  },
};

export const stableDiffusionImageProvider: ImageGenerationProvider = {
  id: "stable-diffusion",
  mode: "local",
  async generateImage(input) {
    const response = await fetch(`${STABLE_DIFFUSION_URL}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: input.prompt,
        steps: 20,
        width: 1024,
        height: 1024,
      }),
    });

    if (!response.ok) throw new Error(`Stable Diffusion failed: ${response.status}`);
    const data: any = await response.json();
    const b64 = data?.images?.[0];
    if (!b64) throw new Error("Stable Diffusion returned no image");

    return { url: `data:image/png;base64,${b64}` };
  },
};
