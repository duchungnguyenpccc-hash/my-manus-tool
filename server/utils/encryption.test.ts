import { describe, it, expect } from "vitest";
import { encryptApiKey, decryptApiKey, validateApiKeyFormat, maskApiKey } from "./encryption";

describe("API Key Encryption", () => {
  describe("encryptApiKey and decryptApiKey", () => {
    it("should encrypt and decrypt API keys correctly", () => {
      const originalKey = "sk-1234567890abcdefghijklmnopqrst";
      const encrypted = encryptApiKey(originalKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(originalKey);
    });

    it("should produce different ciphertexts for same plaintext", () => {
      const originalKey = "sk-1234567890abcdefghijklmnopqrst";
      const encrypted1 = encryptApiKey(originalKey);
      const encrypted2 = encryptApiKey(originalKey);

      expect(encrypted1).not.toBe(encrypted2);
      expect(decryptApiKey(encrypted1)).toBe(originalKey);
      expect(decryptApiKey(encrypted2)).toBe(originalKey);
    });

    it("should handle long API keys", () => {
      const longKey = "sk-" + "a".repeat(200);
      const encrypted = encryptApiKey(longKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(longKey);
    });

    it("should throw error on invalid encrypted data", () => {
      expect(() => {
        decryptApiKey("invalid-base64-data");
      }).toThrow();
    });

    it("should throw error on tampered data", () => {
      const originalKey = "sk-1234567890abcdefghijklmnopqrst";
      const encrypted = encryptApiKey(originalKey);

      // Tamper with the encrypted data
      const tampered = Buffer.from(encrypted, "base64");
      tampered[50] ^= 0xff; // Flip some bits
      const tamperedEncrypted = tampered.toString("base64");

      expect(() => {
        decryptApiKey(tamperedEncrypted);
      }).toThrow();
    });
  });

  describe("validateApiKeyFormat", () => {
    it("should validate OpenAI keys", () => {
      expect(validateApiKeyFormat("openai", "sk-1234567890abcdefghijklmnopqrst")).toBe(true);
      expect(validateApiKeyFormat("openai", "invalid-key")).toBe(false);
      expect(validateApiKeyFormat("openai", "")).toBe(false);
    });

    it("should validate PiAPI keys", () => {
      expect(validateApiKeyFormat("piapi", "abcd1234efgh5678ijkl9012mnop")).toBe(true);
      expect(validateApiKeyFormat("piapi", "short")).toBe(false);
      expect(validateApiKeyFormat("piapi", "")).toBe(false);
    });

    it("should validate ElevenLabs keys", () => {
      expect(validateApiKeyFormat("elevenlabs", "abcd1234efgh5678ijkl9012mnop")).toBe(true);
      expect(validateApiKeyFormat("elevenlabs", "short")).toBe(false);
      expect(validateApiKeyFormat("elevenlabs", "")).toBe(false);
    });

    it("should validate Creatomate keys", () => {
      expect(validateApiKeyFormat("creatomate", "abcd1234efgh5678ijkl9012mnop")).toBe(true);
      expect(validateApiKeyFormat("creatomate", "short")).toBe(false);
      expect(validateApiKeyFormat("creatomate", "")).toBe(false);
    });

    it("should validate YouTube tokens", () => {
      const longToken = "a".repeat(60);
      expect(validateApiKeyFormat("youtube", longToken)).toBe(true);
      expect(validateApiKeyFormat("youtube", "short")).toBe(false);
      expect(validateApiKeyFormat("youtube", "")).toBe(false);
    });

    it("should reject invalid provider", () => {
      expect(validateApiKeyFormat("invalid", "some-key")).toBe(false);
    });

    it("should reject whitespace-only keys", () => {
      expect(validateApiKeyFormat("openai", "   ")).toBe(false);
    });
  });

  describe("maskApiKey", () => {
    it("should mask long API keys", () => {
      const key = "sk-1234567890abcdefghijklmnopqrst";
      const masked = maskApiKey(key);

      expect(masked.startsWith("sk-1")).toBe(true);
      expect(masked.endsWith("qrst")).toBe(true);
      expect(masked).not.toContain("5678");
    });

    it("should handle short API keys", () => {
      const key = "short";
      const masked = maskApiKey(key);

      expect(masked).toBe("****");
    });

    it("should handle very short keys", () => {
      const key = "abc";
      const masked = maskApiKey(key);

      expect(masked).toBe("****");
    });

    it("should show first 4 and last 4 characters", () => {
      const key = "abcdefghijklmnopqrst";
      const masked = maskApiKey(key);

      expect(masked.startsWith("abcd")).toBe(true);
      expect(masked.endsWith("qrst")).toBe(true);
    });
  });
});
