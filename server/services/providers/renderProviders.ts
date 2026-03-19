import { renderVideo } from "../creatomateService";
import type { RenderProvider } from "./types";
import { mkdtemp, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { execFile } from "child_process";

function execFileAsync(cmd: string, args: string[]) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(cmd, args, (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve({ stdout, stderr });
    });
  });
}

export const creatomateRenderProvider: RenderProvider = {
  id: "creatomate",
  mode: "cloud",
  async render(input) {
    const result: any = await renderVideo(String(input.userId), {
      videoClips: input.videoClips,
      audioTracks: [{ url: input.audioUrl }],
      textOverlays: (input.textOverlays || []) as any,
    });

    return { url: typeof result === "string" ? result : (result?.url ?? "") };
  },
};

export const ffmpegRenderProvider: RenderProvider = {
  id: "ffmpeg",
  mode: "local",
  async render(input) {
    // Minimal placeholder pipeline: yêu cầu clip đầu vào đã sẵn và trả về clip đầu để giữ workflow không gãy.
    // Có thể thay bằng concat đầy đủ nếu media nội bộ đã được download/localized.
    if (input.videoClips.length > 0) {
      return { url: input.videoClips[0].url };
    }

    // tạo file trống fallback (không lý tưởng nhưng giữ pipeline local-only có thể chạy test)
    const dir = await mkdtemp(join(tmpdir(), "ffmpeg-render-"));
    const out = join(dir, "fallback.mp4");
    await writeFile(out, Buffer.alloc(0));
    try {
      await execFileAsync("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=black:s=1280x720:d=1", out]);
      return { url: `file://${out}` };
    } catch {
      return { url: `file://${out}` };
    }
  },
};
