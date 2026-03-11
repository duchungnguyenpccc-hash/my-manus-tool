import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  storeApiKey,
  getApiKey,
  hasApiKey,
  getUserApiKeys,
  deleteApiKey,
  deactivateApiKey,
  updateApiKeyTestTime,
  ApiProvider,
} from "../utils/apiKeyDb";
import { maskApiKey } from "../utils/encryption";

const ApiProviderEnum = z.enum(["openai", "piapi", "elevenlabs", "creatomate", "youtube"]);

export const apiKeyRouter = router({
  /**
   * Add or update an API key
   */
  add: protectedProcedure
    .input(
      z.object({
        provider: ApiProviderEnum,
        apiKey: z.string().min(10).max(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const keyId = await storeApiKey(ctx.user.id, input.provider as ApiProvider, input.apiKey);

        return {
          success: true,
          keyId,
          message: `${input.provider} API key saved successfully`,
        };
      } catch (error) {
        console.error("[API Key] Error storing key:", error);
        throw new Error(`Failed to save API key: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Get all API keys for the user (without decrypting)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const keys = await getUserApiKeys(ctx.user.id);

      return {
        success: true,
        keys: keys.map((key) => ({
          id: key.id,
          provider: key.provider,
          isActive: key.isActive,
          lastTestedAt: key.lastTestedAt,
          createdAt: key.createdAt,
          updatedAt: key.updatedAt,
        })),
      };
    } catch (error) {
      console.error("[API Key] Error listing keys:", error);
      throw new Error(`Failed to list API keys: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }),

  /**
   * Check if user has an API key for a provider
   */
  has: protectedProcedure
    .input(
      z.object({
        provider: ApiProviderEnum,
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const has = await hasApiKey(ctx.user.id, input.provider as ApiProvider);
        return {
          success: true,
          has,
        };
      } catch (error) {
        console.error("[API Key] Error checking key:", error);
        throw new Error(`Failed to check API key: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Test an API key by making a simple API call
   */
  test: protectedProcedure
    .input(
      z.object({
        provider: ApiProviderEnum,
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const apiKey = await getApiKey(ctx.user.id, input.provider as ApiProvider);

        if (!apiKey) {
          throw new Error(`No API key found for ${input.provider}`);
        }

        let isValid = false;
        let message = "";

        // Test API key based on provider
        switch (input.provider) {
          case "openai":
            // Test OpenAI API
            try {
              const response = await fetch("https://api.openai.com/v1/models", {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              });
              isValid = response.ok;
              message = isValid ? "OpenAI API key is valid" : "OpenAI API key is invalid";
            } catch {
              message = "Failed to connect to OpenAI API";
            }
            break;

          case "piapi":
            // Test PiAPI
            try {
              const response = await fetch("https://api.piapi.ai/api/v1/task", {
                method: "POST",
                headers: {
                  "X-API-Key": apiKey,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "test",
                  task_type: "test",
                  input: {},
                }),
              });
              // PiAPI returns 400 for invalid models, but 401 for invalid keys
              isValid = response.status !== 401;
              message = isValid ? "PiAPI key is valid" : "PiAPI key is invalid";
            } catch {
              message = "Failed to connect to PiAPI";
            }
            break;

          case "elevenlabs":
            // Test ElevenLabs API
            try {
              const response = await fetch("https://api.elevenlabs.io/v1/voices", {
                headers: {
                  "xi-api-key": apiKey,
                },
              });
              isValid = response.ok;
              message = isValid ? "ElevenLabs API key is valid" : "ElevenLabs API key is invalid";
            } catch {
              message = "Failed to connect to ElevenLabs API";
            }
            break;

          case "creatomate":
            // Test Creatomate API
            try {
              const response = await fetch("https://api.creatomate.com/templates", {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              });
              isValid = response.ok || response.status === 403; // 403 is OK for Creatomate
              message = isValid ? "Creatomate API key is valid" : "Creatomate API key is invalid";
            } catch {
              message = "Failed to connect to Creatomate API";
            }
            break;

          case "youtube":
            // YouTube keys are OAuth tokens, harder to test without making actual API calls
            // Just check if it's a reasonable length
            isValid = apiKey.length > 50;
            message = isValid ? "YouTube token format looks valid" : "YouTube token format is invalid";
            break;
        }

        // Update last tested time if key exists
        if (isValid) {
          const keys = await getUserApiKeys(ctx.user.id);
          const keyRecord = keys.find((k) => k.provider === input.provider);
          if (keyRecord) {
            await updateApiKeyTestTime(keyRecord.id);
          }
        }

        return {
          success: isValid,
          isValid,
          message,
        };
      } catch (error) {
        console.error("[API Key] Error testing key:", error);
        throw new Error(`Failed to test API key: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Delete an API key
   */
  delete: protectedProcedure
    .input(
      z.object({
        keyId: z.number().int(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await deleteApiKey(ctx.user.id, input.keyId);

        return {
          success: true,
          message: "API key deleted successfully",
        };
      } catch (error) {
        console.error("[API Key] Error deleting key:", error);
        throw new Error(`Failed to delete API key: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Deactivate an API key
   */
  deactivate: protectedProcedure
    .input(
      z.object({
        keyId: z.number().int(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await deactivateApiKey(ctx.user.id, input.keyId);

        return {
          success: true,
          message: "API key deactivated successfully",
        };
      } catch (error) {
        console.error("[API Key] Error deactivating key:", error);
        throw new Error(`Failed to deactivate API key: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),
});
