import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getUserPreferences,
  updateUserPreferences,
  getUserAPIKeys,
  addAPIKey,
  revokeAPIKey,
  rotateAPIKey,
  testAPIKey,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
  getSettingsAuditLog,
  exportSettings,
  importSettings,
  resetSettingsToDefaults,
} from "../services/advancedSettingsService";

export const advancedSettingsRouter = router({
  /**
   * Get user preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    return await getUserPreferences(String(ctx.user.id));
  }),

  /**
   * Update user preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        theme: z.enum(["light", "dark", "auto"]).optional(),
        language: z.enum(["en", "vi", "es", "fr", "de", "ja", "zh"]).optional(),
        timezone: z.string().optional(),
        defaultNiche: z.string().optional(),
        defaultQuality: z.enum(["low", "medium", "high", "ultra"]).optional(),
        autoPublish: z.boolean().optional(),
        autoSchedule: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await updateUserPreferences(String(ctx.user.id), input);
    }),

  /**
   * Get API keys
   */
  getAPIKeys: protectedProcedure.query(async ({ ctx }) => {
    return await getUserAPIKeys(String(ctx.user.id));
  }),

  /**
   * Add new API key
   */
  addAPIKey: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.enum(["openai", "piapi", "elevenlabs", "creatomate", "youtube", "google"]),
        key: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await addAPIKey(String(ctx.user.id), input.name, input.type, input.key);
    }),

  /**
   * Revoke API key
   */
  revokeAPIKey: protectedProcedure
    .input(z.object({ keyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await revokeAPIKey(String(ctx.user.id), input.keyId);
    }),

  /**
   * Rotate API key
   */
  rotateAPIKey: protectedProcedure
    .input(z.object({ keyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await rotateAPIKey(String(ctx.user.id), input.keyId);
    }),

  /**
   * Test API key
   */
  testAPIKey: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        key: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await testAPIKey(input.type, input.key);
    }),

  /**
   * Get notification preferences
   */
  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    return await getNotificationPreferences(String(ctx.user.id));
  }),

  /**
   * Update notification preference
   */
  updateNotificationPreference: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
        enabled: z.boolean().optional(),
        frequency: z.enum(["immediate", "daily", "weekly", "never"]).optional(),
        events: z
          .object({
            projectCreated: z.boolean().optional(),
            projectCompleted: z.boolean().optional(),
            videoGenerated: z.boolean().optional(),
            uploadSuccess: z.boolean().optional(),
            uploadFailed: z.boolean().optional(),
            errorOccurred: z.boolean().optional(),
            quotaWarning: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { notificationId, ...updates } = input;
      return await updateNotificationPreferences(String(ctx.user.id), notificationId, updates);
    }),

  /**
   * Send test notification
   */
  sendTestNotification: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
        type: z.enum(["email", "in-app", "webhook"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await sendTestNotification(String(ctx.user.id), input.notificationId, input.type);
    }),

  /**
   * Get audit log
   */
  getAuditLog: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return await getSettingsAuditLog(String(ctx.user.id), input.limit);
    }),

  /**
   * Export settings
   */
  exportSettings: protectedProcedure.query(async ({ ctx }) => {
    const json = await exportSettings(String(ctx.user.id));
    return {
      success: true,
      data: json,
      filename: `settings-${new Date().toISOString().split("T")[0]}.json`,
    };
  }),

  /**
   * Import settings
   */
  importSettings: protectedProcedure
    .input(z.object({ settingsJson: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const success = await importSettings(String(ctx.user.id), input.settingsJson);
      return {
        success,
        message: success ? "Settings imported successfully" : "Failed to import settings",
      };
    }),

  /**
   * Reset settings to defaults
   */
  resetSettingsToDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    return await resetSettingsToDefaults(String(ctx.user.id));
  }),

  /**
   * Update voice preferences
   */
  updateVoicePreferences: protectedProcedure
    .input(
      z.object({
        voiceId: z.string().optional(),
        speed: z.number().min(0.5).max(2.0).optional(),
        pitch: z.number().min(-20).max(20).optional(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prefs = await getUserPreferences(String(ctx.user.id));
      return await updateUserPreferences(String(ctx.user.id), {
        voicePreferences: { ...prefs.voicePreferences, ...input },
      });
    }),

  /**
   * Update video preferences
   */
  updateVideoPreferences: protectedProcedure
    .input(
      z.object({
        resolution: z.enum(["720p", "1080p", "2k", "4k"]).optional(),
        fps: z.union([z.literal(24), z.literal(30), z.literal(60)]).optional(),
        format: z.enum(["mp4", "webm", "mov"]).optional(),
        bitrate: z.enum(["low", "medium", "high"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prefs = await getUserPreferences(String(ctx.user.id));
      return await updateUserPreferences(String(ctx.user.id), {
        videoPreferences: { ...prefs.videoPreferences, ...input },
      });
    }),

  /**
   * Update privacy settings
   */
  updatePrivacySettings: protectedProcedure
    .input(
      z.object({
        shareAnalytics: z.boolean().optional(),
        shareUsageData: z.boolean().optional(),
        allowThirdPartyIntegration: z.boolean().optional(),
        dataRetentionDays: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prefs = await getUserPreferences(String(ctx.user.id));
      return await updateUserPreferences(String(ctx.user.id), {
        privacySettings: { ...prefs.privacySettings, ...input },
      });
    }),

  /**
   * Update advanced settings
   */
  updateAdvancedSettings: protectedProcedure
    .input(
      z.object({
        enableBetaFeatures: z.boolean().optional(),
        enableDebugMode: z.boolean().optional(),
        maxConcurrentJobs: z.number().optional(),
        retryAttempts: z.number().optional(),
        timeoutSeconds: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prefs = await getUserPreferences(String(ctx.user.id));
      return await updateUserPreferences(String(ctx.user.id), {
        advancedSettings: { ...prefs.advancedSettings, ...input },
      });
    }),
});
