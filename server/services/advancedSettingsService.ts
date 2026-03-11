/**
 * Advanced Settings Service
 * Manages user preferences, notifications, and system settings
 */

export interface NotificationPreference {
  id: string;
  type: "email" | "in-app" | "webhook";
  enabled: boolean;
  events: {
    projectCreated: boolean;
    projectCompleted: boolean;
    videoGenerated: boolean;
    uploadSuccess: boolean;
    uploadFailed: boolean;
    errorOccurred: boolean;
    quotaWarning: boolean;
  };
  frequency: "immediate" | "daily" | "weekly" | "never";
  recipients?: string[];
  webhookUrl?: string;
}

export interface UserPreferences {
  userId: string;
  theme: "light" | "dark" | "auto";
  language: "en" | "vi" | "es" | "fr" | "de" | "ja" | "zh";
  timezone: string;
  defaultNiche?: string;
  defaultQuality: "low" | "medium" | "high" | "ultra";
  autoPublish: boolean;
  autoSchedule: boolean;
  notifications: NotificationPreference[];
  voicePreferences: {
    voiceId: string;
    speed: number; // 0.5 to 2.0
    pitch: number; // -20 to 20
    language: string;
  };
  videoPreferences: {
    resolution: "720p" | "1080p" | "2k" | "4k";
    fps: 24 | 30 | 60;
    format: "mp4" | "webm" | "mov";
    bitrate: "low" | "medium" | "high";
  };
  privacySettings: {
    shareAnalytics: boolean;
    shareUsageData: boolean;
    allowThirdPartyIntegration: boolean;
    dataRetentionDays: number;
  };
  advancedSettings: {
    enableBetaFeatures: boolean;
    enableDebugMode: boolean;
    maxConcurrentJobs: number;
    retryAttempts: number;
    timeoutSeconds: number;
  };
}

export interface APIKeyInfo {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  type: "openai" | "piapi" | "elevenlabs" | "creatomate" | "youtube" | "google";
  status: "active" | "inactive" | "expired";
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  usageCount: number;
  rateLimit: number;
  rateLimitRemaining: number;
}

export interface SettingsAuditLog {
  id: string;
  userId: string;
  action: string;
  changes: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  // Mock implementation - in production would fetch from database
  return {
    userId,
    theme: "dark",
    language: "en",
    timezone: "UTC",
    defaultNiche: "AI/Tech",
    defaultQuality: "high",
    autoPublish: false,
    autoSchedule: false,
    notifications: [
      {
        id: "notif-1",
        type: "in-app",
        enabled: true,
        events: {
          projectCreated: true,
          projectCompleted: true,
          videoGenerated: true,
          uploadSuccess: true,
          uploadFailed: true,
          errorOccurred: true,
          quotaWarning: true,
        },
        frequency: "immediate",
      },
    ],
    voicePreferences: {
      voiceId: "en-US-Neural2-C",
      speed: 1.0,
      pitch: 0,
      language: "en-US",
    },
    videoPreferences: {
      resolution: "1080p",
      fps: 30,
      format: "mp4",
      bitrate: "high",
    },
    privacySettings: {
      shareAnalytics: true,
      shareUsageData: false,
      allowThirdPartyIntegration: false,
      dataRetentionDays: 90,
    },
    advancedSettings: {
      enableBetaFeatures: false,
      enableDebugMode: false,
      maxConcurrentJobs: 5,
      retryAttempts: 3,
      timeoutSeconds: 300,
    },
  };
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  // Mock implementation - in production would update database
  const current = await getUserPreferences(userId);
  return { ...current, ...updates };
}

/**
 * Get API keys for user
 */
export async function getUserAPIKeys(userId: string): Promise<APIKeyInfo[]> {
  // Mock implementation - in production would fetch from database
  return [
    {
      id: "key-1",
      name: "OpenAI Production",
      key: "sk-...",
      maskedKey: "sk-***...***",
      type: "openai",
      status: "active",
      createdAt: new Date(Date.now() - 86400000 * 30),
      lastUsedAt: new Date(Date.now() - 3600000),
      expiresAt: new Date(Date.now() + 86400000 * 365),
      usageCount: 1250,
      rateLimit: 3500,
      rateLimitRemaining: 2250,
    },
    {
      id: "key-2",
      name: "YouTube API",
      key: "AIzaSy...",
      maskedKey: "AIzaSy***...***",
      type: "youtube",
      status: "active",
      createdAt: new Date(Date.now() - 86400000 * 60),
      lastUsedAt: new Date(Date.now() - 7200000),
      usageCount: 450,
      rateLimit: 10000,
      rateLimitRemaining: 9550,
    },
  ];
}

/**
 * Add new API key
 */
export async function addAPIKey(
  userId: string,
  name: string,
  type: string,
  key: string
): Promise<APIKeyInfo> {
  // Mock implementation - in production would save to database with encryption
  return {
    id: `key-${Date.now()}`,
    name,
    key,
    maskedKey: `${key.substring(0, 6)}***${key.substring(key.length - 6)}`,
    type: type as any,
    status: "active",
    createdAt: new Date(),
    usageCount: 0,
    rateLimit: 5000,
    rateLimitRemaining: 5000,
  };
}

/**
 * Revoke API key
 */
export async function revokeAPIKey(userId: string, keyId: string): Promise<boolean> {
  // Mock implementation - in production would mark as inactive in database
  return true;
}

/**
 * Rotate API key
 */
export async function rotateAPIKey(userId: string, keyId: string): Promise<APIKeyInfo> {
  // Mock implementation - in production would generate new key and archive old one
  return {
    id: `key-${Date.now()}`,
    name: "Rotated Key",
    key: "new-key-value",
    maskedKey: "new-***...***",
    type: "openai",
    status: "active",
    createdAt: new Date(),
    usageCount: 0,
    rateLimit: 5000,
    rateLimitRemaining: 5000,
  };
}

/**
 * Test API key validity
 */
export async function testAPIKey(type: string, key: string): Promise<{
  valid: boolean;
  message: string;
  quotaInfo?: {
    used: number;
    limit: number;
    remaining: number;
  };
}> {
  // Mock implementation - in production would actually test the key
  return {
    valid: true,
    message: "API key is valid and active",
    quotaInfo: {
      used: 1250,
      limit: 3500,
      remaining: 2250,
    },
  };
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
  const prefs = await getUserPreferences(userId);
  return prefs.notifications;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  notificationId: string,
  updates: any
): Promise<NotificationPreference> {
  // Mock implementation - in production would update database
  return {
    id: notificationId,
    type: "in-app",
    enabled: true,
    events: {
      projectCreated: true,
      projectCompleted: true,
      videoGenerated: true,
      uploadSuccess: true,
      uploadFailed: true,
      errorOccurred: true,
      quotaWarning: true,
    },
    frequency: "immediate",
    ...updates,
  };
}

/**
 * Send test notification
 */
export async function sendTestNotification(
  userId: string,
  notificationId: string,
  type: string
): Promise<{ success: boolean; message: string }> {
  // Mock implementation - in production would send actual notification
  return {
    success: true,
    message: `Test ${type} notification sent successfully`,
  };
}

/**
 * Get settings audit log
 */
export async function getSettingsAuditLog(
  userId: string,
  limit: number = 50
): Promise<SettingsAuditLog[]> {
  // Mock implementation - in production would fetch from database
  return [
    {
      id: "audit-1",
      userId,
      action: "Updated theme to dark",
      changes: { theme: { old: "light", new: "dark" } },
      timestamp: new Date(Date.now() - 3600000),
      ipAddress: "192.168.1.1",
    },
    {
      id: "audit-2",
      userId,
      action: "Added new API key",
      changes: { apiKeys: { added: "OpenAI Production" } },
      timestamp: new Date(Date.now() - 86400000),
      ipAddress: "192.168.1.1",
    },
  ];
}

/**
 * Export settings
 */
export async function exportSettings(userId: string): Promise<string> {
  const prefs = await getUserPreferences(userId);
  return JSON.stringify(prefs, null, 2);
}

/**
 * Import settings
 */
export async function importSettings(userId: string, settingsJson: string): Promise<boolean> {
  try {
    const settings = JSON.parse(settingsJson);
    await updateUserPreferences(userId, settings);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Reset settings to defaults
 */
export async function resetSettingsToDefaults(userId: string): Promise<UserPreferences> {
  const defaults: UserPreferences = {
    userId,
    theme: "dark",
    language: "en",
    timezone: "UTC",
    defaultQuality: "high",
    autoPublish: false,
    autoSchedule: false,
    notifications: [],
    voicePreferences: {
      voiceId: "en-US-Neural2-C",
      speed: 1.0,
      pitch: 0,
      language: "en-US",
    },
    videoPreferences: {
      resolution: "1080p",
      fps: 30,
      format: "mp4",
      bitrate: "high",
    },
    privacySettings: {
      shareAnalytics: true,
      shareUsageData: false,
      allowThirdPartyIntegration: false,
      dataRetentionDays: 90,
    },
    advancedSettings: {
      enableBetaFeatures: false,
      enableDebugMode: false,
      maxConcurrentJobs: 5,
      retryAttempts: 3,
      timeoutSeconds: 300,
    },
  };

  return defaults;
}
