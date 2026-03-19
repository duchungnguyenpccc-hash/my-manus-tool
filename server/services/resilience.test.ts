import { describe, it, expect, vi } from "vitest";
import { withRetry, withTimeout, isRetryableError } from "./resilience";

describe("resilience", () => {
  it("should retry until success", async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error("network timeout");
      }
      return "ok";
    }, { maxAttempts: 3, baseDelayMs: 1, jitterMs: 0 });

    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("should not retry non-retryable errors", async () => {
    const fn = vi.fn(async () => {
      throw new Error("invalid api key");
    });

    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 1, jitterMs: 0 })).rejects.toThrow("invalid api key");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should timeout operations", async () => {
    await expect(
      withTimeout(new Promise((resolve) => setTimeout(resolve, 30)), 10, "slow-op")
    ).rejects.toThrow("slow-op timed out");
  });

  it("should classify retryable errors", () => {
    expect(isRetryableError(new Error("429 rate limit"))).toBe(true);
    expect(isRetryableError(new Error("invalid api key"))).toBe(false);
  });
});
