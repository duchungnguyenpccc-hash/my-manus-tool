/**
 * Asset Composition Service
 * Manages composition of all generated assets (images, videos, audio) for final rendering
 */

export interface Asset {
  id: string;
  type: "image" | "video" | "audio";
  url: string;
  duration?: number; // in seconds
  order: number;
  metadata?: Record<string, unknown>;
}

export interface CompositionElement {
  type: "video" | "image" | "text" | "audio";
  duration: number;
  url?: string;
  text?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  order: number;
}

export interface VideoComposition {
  elements: CompositionElement[];
  totalDuration: number;
  resolution: { width: number; height: number };
  fps: number;
  audioTrack?: string;
}

/**
 * Asset Composition Service
 */
export class AssetCompositionService {
  /**
   * Compose all assets into a structured format for rendering
   */
  static composeAssets(
    images: Asset[],
    videos: Asset[],
    audio: Asset,
    script: string
  ): VideoComposition {
    // Validate inputs
    if (!images || images.length === 0) {
      throw new Error("At least one image is required");
    }

    if (!videos || videos.length === 0) {
      throw new Error("At least one video is required");
    }

    if (!audio) {
      throw new Error("Audio track is required");
    }

    // Sort by order
    const sortedImages = [...images].sort((a, b) => a.order - b.order);
    const sortedVideos = [...videos].sort((a, b) => a.order - b.order);

    // Calculate composition
    const elements: CompositionElement[] = [];
    let currentTime = 0;

    // Add images and videos alternately
    const totalAssets = Math.max(sortedImages.length, sortedVideos.length);
    const assetDuration = (audio.duration || 60) / totalAssets;

    for (let i = 0; i < totalAssets; i++) {
      // Add image
      if (i < sortedImages.length) {
        elements.push({
          type: "image",
          url: sortedImages[i]!.url,
          duration: assetDuration,
          order: i * 2,
          position: { x: 0, y: 0 },
          size: { width: 1920, height: 1080 },
        });
      }

      // Add video
      if (i < sortedVideos.length) {
        elements.push({
          type: "video",
          url: sortedVideos[i]!.url,
          duration: assetDuration,
          order: i * 2 + 1,
          position: { x: 0, y: 0 },
          size: { width: 1920, height: 1080 },
        });
      }

      currentTime += assetDuration;
    }

    // Add audio track
    const composition: VideoComposition = {
      elements,
      totalDuration: audio.duration || 60,
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      audioTrack: audio.url,
    };

    return composition;
  }

  /**
   * Validate composition
   */
  static validateComposition(composition: VideoComposition): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!composition.elements || composition.elements.length === 0) {
      errors.push("No elements in composition");
    }

    if (composition.totalDuration <= 0) {
      errors.push("Total duration must be positive");
    }

    if (composition.resolution.width <= 0 || composition.resolution.height <= 0) {
      errors.push("Invalid resolution");
    }

    if (composition.fps <= 0 || composition.fps > 60) {
      errors.push("Invalid FPS (must be 1-60)");
    }

    // Check for duplicate orders
    const orders = composition.elements.map((e) => e.order);
    if (new Set(orders).size !== orders.length) {
      errors.push("Duplicate element orders found");
    }

    // Check for missing URLs
    const missingUrls = composition.elements.filter(
      (e) => (e.type === "image" || e.type === "video") && !e.url
    );
    if (missingUrls.length > 0) {
      errors.push(`${missingUrls.length} elements missing URLs`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get composition summary
   */
  static getSummary(composition: VideoComposition): string {
    const imageCount = composition.elements.filter((e) => e.type === "image").length;
    const videoCount = composition.elements.filter((e) => e.type === "video").length;
    const textCount = composition.elements.filter((e) => e.type === "text").length;

    return `Video Composition Summary:
- Total Duration: ${composition.totalDuration}s
- Resolution: ${composition.resolution.width}x${composition.resolution.height}
- FPS: ${composition.fps}
- Elements: ${imageCount} images, ${videoCount} videos, ${textCount} text
- Total Elements: ${composition.elements.length}
- Audio Track: ${composition.audioTrack ? "✓ Included" : "✗ Missing"}`;
  }

  /**
   * Merge multiple compositions
   */
  static mergeCompositions(
    compositions: VideoComposition[]
  ): VideoComposition {
    if (compositions.length === 0) {
      throw new Error("At least one composition is required");
    }

    if (compositions.length === 1) {
      return compositions[0]!;
    }

    // Merge all elements
    const allElements: CompositionElement[] = [];
    let totalDuration = 0;
    let currentOrder = 0;

    compositions.forEach((comp) => {
      comp.elements.forEach((element) => {
        allElements.push({
          ...element,
          order: currentOrder++,
        });
      });
      totalDuration += comp.totalDuration;
    });

    return {
      elements: allElements,
      totalDuration,
      resolution: compositions[0]!.resolution,
      fps: compositions[0]!.fps,
      audioTrack: compositions[0]!.audioTrack,
    };
  }

  /**
   * Export composition as JSON
   */
  static exportAsJSON(composition: VideoComposition): string {
    return JSON.stringify(composition, null, 2);
  }

  /**
   * Export composition as Creatomate RenderScript format
   */
  static exportAsCreatomateScript(
    composition: VideoComposition,
    title: string = "Generated Video"
  ): Record<string, unknown> {
    const clips: Record<string, unknown>[] = [];

    composition.elements.forEach((element, index) => {
      if (element.type === "image") {
        clips.push({
          type: "image",
          source: element.url,
          duration: element.duration,
          x: element.position?.x || 0,
          y: element.position?.y || 0,
          width: element.size?.width || 1920,
          height: element.size?.height || 1080,
        });
      } else if (element.type === "video") {
        clips.push({
          type: "video",
          source: element.url,
          duration: element.duration,
          x: element.position?.x || 0,
          y: element.position?.y || 0,
          width: element.size?.width || 1920,
          height: element.size?.height || 1080,
        });
      }
    });

    // Add audio track
    if (composition.audioTrack) {
      clips.push({
        type: "audio",
        source: composition.audioTrack,
        duration: composition.totalDuration,
      });
    }

    return {
      canvas: {
        width: composition.resolution.width,
        height: composition.resolution.height,
        duration: composition.totalDuration,
        fps: composition.fps,
      },
      clips,
      title,
    };
  }
}
