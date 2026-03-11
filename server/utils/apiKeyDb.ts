import { eq, and } from "drizzle-orm";
import { apiKeys } from "../../drizzle/schema";
import { getDb } from "../db";
import { encryptApiKey, decryptApiKey, validateApiKeyFormat } from "./encryption";

export type ApiProvider = "openai" | "piapi" | "elevenlabs" | "creatomate" | "youtube";

/**
 * Store an API key securely
 */
export async function storeApiKey(
  userId: number,
  provider: ApiProvider,
  plainApiKey: string
): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Validate format
  if (!validateApiKeyFormat(provider, plainApiKey)) {
    throw new Error(`Invalid API key format for provider: ${provider}`);
  }

  // Encrypt the API key
  const encryptedKey = encryptApiKey(plainApiKey);

  // Check if key already exists for this provider
  const existing = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing key
    await db
      .update(apiKeys)
      .set({
        encryptedKey,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert new key
    const result = await db.insert(apiKeys).values({
      userId,
      provider,
      encryptedKey,
      isActive: true,
    });
    return (result as any).insertId || 0;
  }
}

/**
 * Retrieve and decrypt an API key
 */
export async function getApiKey(userId: number, provider: ApiProvider): Promise<string | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider), eq(apiKeys.isActive, true)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  try {
    const decrypted = decryptApiKey(result[0].encryptedKey);
    return decrypted;
  } catch (error) {
    console.error(`[API Key] Failed to decrypt ${provider} key for user ${userId}:`, error);
    return null;
  }
}

/**
 * Check if user has an API key for a provider
 */
export async function hasApiKey(userId: number, provider: ApiProvider): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider), eq(apiKeys.isActive, true)))
    .limit(1);

  return result.length > 0;
}

/**
 * Get all API keys for a user (without decrypting)
 */
export async function getUserApiKeys(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));

  return result.map((key) => ({
    id: key.id,
    provider: key.provider,
    isActive: key.isActive,
    lastTestedAt: key.lastTestedAt,
    createdAt: key.createdAt,
    updatedAt: key.updatedAt,
  }));
}

/**
 * Delete an API key
 */
export async function deleteApiKey(userId: number, keyId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const existing = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId)).limit(1);

  if (existing.length === 0 || existing[0].userId !== userId) {
    throw new Error("API key not found or unauthorized");
  }

  await db.delete(apiKeys).where(eq(apiKeys.id, keyId));
  return true;
}

/**
 * Deactivate an API key
 */
export async function deactivateApiKey(userId: number, keyId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const existing = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId)).limit(1);

  if (existing.length === 0 || existing[0].userId !== userId) {
    throw new Error("API key not found or unauthorized");
  }

  await db
    .update(apiKeys)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(apiKeys.id, keyId));

  return true;
}

/**
 * Update last tested timestamp
 */
export async function updateApiKeyTestTime(keyId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(apiKeys)
    .set({
      lastTestedAt: new Date(),
    })
    .where(eq(apiKeys.id, keyId));
}
