import crypto from "crypto";
import { ENV } from "../_core/env";

/**
 * Encryption utility for securely storing and retrieving API keys
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = "aes-256-gcm";
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive a key from the master secret using PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  const masterSecret = ENV.cookieSecret || "default-secret";
  return crypto.pbkdf2Sync(masterSecret, salt, 100000, 32, "sha256");
}

/**
 * Encrypt sensitive data (API keys)
 * Returns: salt + iv + authTag + encryptedData (all base64 encoded)
 */
export function encryptApiKey(plaintext: string): string {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(salt);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();

    // Combine: salt + iv + authTag + encrypted
    const combined = Buffer.concat([salt, iv, authTag, Buffer.from(encrypted, "hex")]);
    return combined.toString("base64");
  } catch (error) {
    console.error("[Encryption] Failed to encrypt API key:", error);
    throw new Error("Failed to encrypt API key");
  }
}

/**
 * Decrypt API key
 * Input: base64 encoded (salt + iv + authTag + encryptedData)
 */
export function decryptApiKey(encryptedData: string): string {
  try {
    const combined = Buffer.from(encryptedData, "base64");

    // Extract components
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    // Derive key using same salt
    const key = deriveKey(salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("[Encryption] Failed to decrypt API key:", error);
    throw new Error("Failed to decrypt API key - it may be corrupted or tampered with");
  }
}

/**
 * Validate API key format (basic check)
 */
export function validateApiKeyFormat(provider: string, apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
    return false;
  }

  // Provider-specific validation
  switch (provider) {
    case "openai":
      // OpenAI keys start with "sk-"
      return apiKey.startsWith("sk-");
    case "piapi":
      // PiAPI keys are typically alphanumeric
      return /^[a-zA-Z0-9_-]{20,}$/.test(apiKey);
    case "elevenlabs":
      // ElevenLabs keys are alphanumeric
      return /^[a-zA-Z0-9]{20,}$/.test(apiKey);
    case "creatomate":
      // Creatomate keys are alphanumeric
      return /^[a-zA-Z0-9_-]{20,}$/.test(apiKey);
    case "youtube":
      // YouTube OAuth tokens are complex, just check length
      return apiKey.length > 50;
    default:
      return false;
  }
}

/**
 * Mask API key for display (show first 4 and last 4 characters)
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return "****";
  }
  const first4 = apiKey.substring(0, 4);
  const last4 = apiKey.substring(apiKey.length - 4);
  const masked = "*".repeat(apiKey.length - 8);
  return `${first4}${masked}${last4}`;
}
