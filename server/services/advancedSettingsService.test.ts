import { describe, it, expect } from "vitest";
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
} from "./advancedSettingsService";

describe("Advanced Settings Service", () => {
  const testUserId = "test-user-123";

  describe("getUserPreferences", () => {
    it("should return user preferences", async () => {
      const prefs = await getUserPreferences(testUserId);
      expect(prefs).toBeDefined();
      expect(prefs.userId).toBe(testUserId);
      expect(prefs.theme).toBe("dark");
      expect(prefs.language).toBe("en");
    });

    it("should have default values", async () => {
      const prefs = await getUserPreferences(testUserId);
      expect(prefs.defaultQuality).toBe("high");
      expect(prefs.autoPublish).toBe(false);
      expect(prefs.autoSchedule).toBe(false);
    });

    it("should have voice preferences", async () => {
      const prefs = await getUserPreferences(testUserId);
      expect(prefs.voicePreferences).toBeDefined();
      expect(prefs.voicePreferences.speed).toBe(1.0);
      expect(prefs.voicePreferences.pitch).toBe(0);
    });

    it("should have video preferences", async () => {
      const prefs = await getUserPreferences(testUserId);
      expect(prefs.videoPreferences).toBeDefined();
      expect(prefs.videoPreferences.resolution).toBe("1080p");
      expect(prefs.videoPreferences.fps).toBe(30);
      expect(prefs.videoPreferences.format).toBe("mp4");
    });

    it("should have privacy settings", async () => {
      const prefs = await getUserPreferences(testUserId);
      expect(prefs.privacySettings).toBeDefined();
      expect(prefs.privacySettings.shareAnalytics).toBe(true);
      expect(prefs.privacySettings.shareUsageData).toBe(false);
    });

    it("should have advanced settings", async () => {
      const prefs = await getUserPreferences(testUserId);
      expect(prefs.advancedSettings).toBeDefined();
      expect(prefs.advancedSettings.enableBetaFeatures).toBe(false);
      expect(prefs.advancedSettings.maxConcurrentJobs).toBe(5);
    });
  });

  describe("updateUserPreferences", () => {
    it("should update theme preference", async () => {
      const updated = await updateUserPreferences(testUserId, { theme: "light" });
      expect(updated.theme).toBe("light");
    });

    it("should update language preference", async () => {
      const updated = await updateUserPreferences(testUserId, { language: "vi" });
      expect(updated.language).toBe("vi");
    });

    it("should preserve other preferences", async () => {
      const updated = await updateUserPreferences(testUserId, { theme: "light" });
      expect(updated.language).toBe("en");
      expect(updated.defaultQuality).toBe("high");
    });
  });

  describe("getUserAPIKeys", () => {
    it("should return array of API keys", async () => {
      const keys = await getUserAPIKeys(testUserId);
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
    });

    it("should have required fields", async () => {
      const keys = await getUserAPIKeys(testUserId);
      keys.forEach((key) => {
        expect(key.id).toBeDefined();
        expect(key.name).toBeDefined();
        expect(key.type).toBeDefined();
        expect(key.status).toBeDefined();
        expect(key.maskedKey).toBeDefined();
      });
    });

    it("should mask API keys", async () => {
      const keys = await getUserAPIKeys(testUserId);
      keys.forEach((key) => {
        expect(key.maskedKey).toContain("***");
        expect(key.maskedKey).not.toBe(key.key);
      });
    });
  });

  describe("addAPIKey", () => {
    it("should add new API key", async () => {
      const newKey = await addAPIKey(testUserId, "Test Key", "openai", "sk-test123");
      expect(newKey).toBeDefined();
      expect(newKey.name).toBe("Test Key");
      expect(newKey.type).toBe("openai");
      expect(newKey.status).toBe("active");
    });

    it("should mask the key", async () => {
      const newKey = await addAPIKey(testUserId, "Test Key", "openai", "sk-test123");
      expect(newKey.maskedKey).toContain("***");
      expect(newKey.maskedKey).not.toBe("sk-test123");
    });
  });

  describe("revokeAPIKey", () => {
    it("should revoke API key", async () => {
      const result = await revokeAPIKey(testUserId, "key-123");
      expect(result).toBe(true);
    });
  });

  describe("rotateAPIKey", () => {
    it("should rotate API key", async () => {
      const rotated = await rotateAPIKey(testUserId, "key-123");
      expect(rotated).toBeDefined();
      expect(rotated.status).toBe("active");
      expect(rotated.createdAt).toBeDefined();
    });
  });

  describe("testAPIKey", () => {
    it("should test API key validity", async () => {
      const result = await testAPIKey("openai", "sk-test");
      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.message).toBeDefined();
    });

    it("should return quota info", async () => {
      const result = await testAPIKey("openai", "sk-test");
      expect(result.quotaInfo).toBeDefined();
      expect(result.quotaInfo?.used).toBeDefined();
      expect(result.quotaInfo?.limit).toBeDefined();
      expect(result.quotaInfo?.remaining).toBeDefined();
    });
  });

  describe("getNotificationPreferences", () => {
    it("should return notification preferences", async () => {
      const notifs = await getNotificationPreferences(testUserId);
      expect(Array.isArray(notifs)).toBe(true);
    });
  });

  describe("updateNotificationPreferences", () => {
    it("should update notification preferences", async () => {
      const updated = await updateNotificationPreferences(testUserId, "notif-1", {
        enabled: false,
      });
      expect(updated).toBeDefined();
      expect(updated.enabled).toBe(false);
    });
  });

  describe("sendTestNotification", () => {
    it("should send test notification", async () => {
      const result = await sendTestNotification(testUserId, "notif-1", "email");
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });
  });

  describe("getSettingsAuditLog", () => {
    it("should return audit log", async () => {
      const logs = await getSettingsAuditLog(testUserId);
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const logs = await getSettingsAuditLog(testUserId, 5);
      expect(logs.length).toBeLessThanOrEqual(5);
    });
  });

  describe("exportSettings", () => {
    it("should export settings as JSON", async () => {
      const json = await exportSettings(testUserId);
      expect(typeof json).toBe("string");
      const parsed = JSON.parse(json);
      expect(parsed.userId).toBe(testUserId);
    });
  });

  describe("importSettings", () => {
    it("should import valid settings", async () => {
      const prefs = await getUserPreferences(testUserId);
      const json = JSON.stringify(prefs);
      const result = await importSettings(testUserId, json);
      expect(result).toBe(true);
    });

    it("should reject invalid JSON", async () => {
      const result = await importSettings(testUserId, "invalid json");
      expect(result).toBe(false);
    });
  });

  describe("resetSettingsToDefaults", () => {
    it("should reset to default settings", async () => {
      const defaults = await resetSettingsToDefaults(testUserId);
      expect(defaults.theme).toBe("dark");
      expect(defaults.language).toBe("en");
      expect(defaults.autoPublish).toBe(false);
      expect(defaults.autoSchedule).toBe(false);
    });

    it("should have default video preferences", async () => {
      const defaults = await resetSettingsToDefaults(testUserId);
      expect(defaults.videoPreferences.resolution).toBe("1080p");
      expect(defaults.videoPreferences.fps).toBe(30);
    });

    it("should have default privacy settings", async () => {
      const defaults = await resetSettingsToDefaults(testUserId);
      expect(defaults.privacySettings.shareAnalytics).toBe(true);
      expect(defaults.privacySettings.shareUsageData).toBe(false);
    });
  });
});
