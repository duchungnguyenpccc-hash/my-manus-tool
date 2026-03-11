/**
 * Error Recovery Service
 * Handles error detection, logging, suggestions, and recovery
 */

export interface ErrorLog {
  id: string;
  timestamp: Date;
  errorType: string;
  message: string;
  stack?: string;
  context: Record<string, any>;
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
  resolution?: string;
}

export interface ErrorSuggestion {
  suggestion: string;
  action: string;
  link?: string;
  priority: "low" | "medium" | "high";
}

export interface ErrorAnalysis {
  errorType: string;
  rootCause: string;
  suggestions: ErrorSuggestion[];
  preventionTips: string[];
  relatedErrors: string[];
}

/**
 * Categorize error and provide suggestions
 */
export function analyzeError(error: Error | string, context?: Record<string, any>): ErrorAnalysis {
  const errorMessage = typeof error === "string" ? error : error.message;
  const errorType = typeof error === "string" ? "Unknown" : error.constructor.name;

  // API Key Errors
  if (
    errorMessage.includes("API key") ||
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("401")
  ) {
    return {
      errorType: "API Key Error",
      rootCause: "Invalid or expired API key",
      suggestions: [
        {
          suggestion: "Check if your API key is correct",
          action: "Go to Settings and verify your API key",
          link: "/settings",
          priority: "high",
        },
        {
          suggestion: "API key may have expired",
          action: "Generate a new API key from your provider's dashboard",
          priority: "high",
        },
        {
          suggestion: "Check API key permissions",
          action: "Ensure the API key has necessary permissions",
          priority: "medium",
        },
      ],
      preventionTips: [
        "Regularly rotate your API keys",
        "Use separate API keys for development and production",
        "Monitor API key usage in provider dashboard",
      ],
      relatedErrors: ["Authentication Failed", "Forbidden Access"],
    };
  }

  // Rate Limit Errors
  if (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("429") ||
    errorMessage.includes("too many requests")
  ) {
    return {
      errorType: "Rate Limit Error",
      rootCause: "Too many requests to API in short time",
      suggestions: [
        {
          suggestion: "Wait before retrying",
          action: "The system will automatically retry in a few moments",
          priority: "high",
        },
        {
          suggestion: "Reduce request frequency",
          action: "Spread out your video generation tasks over time",
          priority: "medium",
        },
        {
          suggestion: "Upgrade your API plan",
          action: "Contact your API provider for higher rate limits",
          priority: "low",
        },
      ],
      preventionTips: [
        "Implement request queuing",
        "Use exponential backoff for retries",
        "Monitor API usage regularly",
      ],
      relatedErrors: ["Timeout", "Service Unavailable"],
    };
  }

  // Network Errors
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("ECONNREFUSED")
  ) {
    return {
      errorType: "Network Error",
      rootCause: "Connection issue with external service",
      suggestions: [
        {
          suggestion: "Check your internet connection",
          action: "Verify you have stable internet access",
          priority: "high",
        },
        {
          suggestion: "Service may be temporarily unavailable",
          action: "Try again in a few minutes",
          priority: "medium",
        },
        {
          suggestion: "Check firewall settings",
          action: "Ensure firewall allows connections to the API",
          priority: "medium",
        },
      ],
      preventionTips: [
        "Use connection pooling",
        "Implement health checks",
        "Monitor service status",
      ],
      relatedErrors: ["Connection Timeout", "DNS Resolution Failed"],
    };
  }

  // Storage Errors
  if (
    errorMessage.includes("storage") ||
    errorMessage.includes("S3") ||
    errorMessage.includes("bucket")
  ) {
    return {
      errorType: "Storage Error",
      rootCause: "Issue with file storage or upload",
      suggestions: [
        {
          suggestion: "Check file size limits",
          action: "Ensure file is not exceeding size limits",
          priority: "high",
        },
        {
          suggestion: "Verify storage credentials",
          action: "Check S3 bucket configuration and permissions",
          priority: "high",
        },
        {
          suggestion: "Check available storage space",
          action: "Ensure you have enough storage quota",
          priority: "medium",
        },
      ],
      preventionTips: [
        "Monitor storage usage",
        "Implement file cleanup policies",
        "Use compression for large files",
      ],
      relatedErrors: ["Upload Failed", "Access Denied"],
    };
  }

  // Database Errors
  if (
    errorMessage.includes("database") ||
    errorMessage.includes("query") ||
    errorMessage.includes("connection")
  ) {
    return {
      errorType: "Database Error",
      rootCause: "Issue with database connection or query",
      suggestions: [
        {
          suggestion: "Check database connection",
          action: "Verify database is running and accessible",
          priority: "high",
        },
        {
          suggestion: "Review query syntax",
          action: "Check if the query is properly formatted",
          priority: "medium",
        },
        {
          suggestion: "Check database permissions",
          action: "Ensure user has necessary permissions",
          priority: "medium",
        },
      ],
      preventionTips: [
        "Use connection pooling",
        "Implement query timeouts",
        "Regular database backups",
      ],
      relatedErrors: ["Query Timeout", "Connection Pool Exhausted"],
    };
  }

  // Default Error
  return {
    errorType: errorType,
    rootCause: errorMessage,
    suggestions: [
      {
        suggestion: "Check error details",
        action: "Review the error message and stack trace",
        priority: "high",
      },
      {
        suggestion: "Try again",
        action: "Attempt the operation again",
        priority: "medium",
      },
      {
        suggestion: "Contact support",
        action: "If problem persists, contact support team",
        priority: "low",
      },
    ],
    preventionTips: ["Monitor system logs", "Implement error tracking", "Regular testing"],
    relatedErrors: [],
  };
}

/**
 * Suggest recovery action based on error
 */
export function suggestRecoveryAction(
  errorType: string,
  context?: Record<string, any>
): {
  action: string;
  autoRetry: boolean;
  retryDelay: number;
  fallback?: string;
} {
  // Rate limit - exponential backoff
  if (errorType.includes("Rate Limit")) {
    return {
      action: "Wait and retry with exponential backoff",
      autoRetry: true,
      retryDelay: 5000 + Math.random() * 5000,
      fallback: "Queue for later processing",
    };
  }

  // Network error - retry with backoff
  if (errorType.includes("Network")) {
    return {
      action: "Retry connection with exponential backoff",
      autoRetry: true,
      retryDelay: 2000 + Math.random() * 3000,
      fallback: "Use cached data if available",
    };
  }

  // API Key error - don't retry
  if (errorType.includes("API Key")) {
    return {
      action: "Require user to update API key",
      autoRetry: false,
      retryDelay: 0,
      fallback: "Redirect to Settings page",
    };
  }

  // Storage error - retry once
  if (errorType.includes("Storage")) {
    return {
      action: "Retry upload operation",
      autoRetry: true,
      retryDelay: 1000,
      fallback: "Use alternative storage location",
    };
  }

  // Default - retry with backoff
  return {
    action: "Retry operation with exponential backoff",
    autoRetry: true,
    retryDelay: 1000,
    fallback: "Manual retry required",
  };
}

/**
 * Format error message for user display
 */
export function formatErrorForUser(error: Error | string): {
  title: string;
  message: string;
  icon: string;
} {
  const errorMessage = typeof error === "string" ? error : error.message;

  if (errorMessage.includes("API key")) {
    return {
      title: "API Key Error",
      message: "Your API key is invalid or expired. Please update it in Settings.",
      icon: "🔑",
    };
  }

  if (errorMessage.includes("rate limit")) {
    return {
      title: "Too Many Requests",
      message: "You've made too many requests. Please wait a moment and try again.",
      icon: "⏱️",
    };
  }

  if (errorMessage.includes("network")) {
    return {
      title: "Network Error",
      message: "Connection issue. Please check your internet and try again.",
      icon: "🌐",
    };
  }

  if (errorMessage.includes("storage")) {
    return {
      title: "Storage Error",
      message: "Failed to save file. Please check your storage settings.",
      icon: "💾",
    };
  }

  if (errorMessage.includes("database")) {
    return {
      title: "Database Error",
      message: "Database connection failed. Please try again later.",
      icon: "🗄️",
    };
  }

  return {
    title: "Error",
    message: errorMessage || "An unexpected error occurred. Please try again.",
    icon: "❌",
  };
}

/**
 * Create error log entry
 */
export function createErrorLog(
  error: Error | string,
  context?: Record<string, any>
): ErrorLog {
  const errorMessage = typeof error === "string" ? error : error.message;
  const errorType = typeof error === "string" ? "Unknown" : error.constructor.name;
  const stack = typeof error === "string" ? undefined : error.stack;

  // Determine severity
  let severity: "low" | "medium" | "high" | "critical" = "medium";
  if (errorMessage.includes("critical")) severity = "critical";
  else if (errorMessage.includes("fatal")) severity = "high";
  else if (errorMessage.includes("warning")) severity = "low";

  return {
    id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    errorType,
    message: errorMessage,
    stack,
    context: context || {},
    severity,
    resolved: false,
  };
}

/**
 * Get error statistics
 */
export function getErrorStatistics(errorLogs: ErrorLog[]): {
  totalErrors: number;
  resolvedErrors: number;
  unresolvedErrors: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  criticalErrors: ErrorLog[];
} {
  const bySeverity: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  const byType: Record<string, number> = {};
  const criticalErrors: ErrorLog[] = [];

  errorLogs.forEach((log) => {
    bySeverity[log.severity]++;
    byType[log.errorType] = (byType[log.errorType] || 0) + 1;
    if (log.severity === "critical") criticalErrors.push(log);
  });

  return {
    totalErrors: errorLogs.length,
    resolvedErrors: errorLogs.filter((l) => l.resolved).length,
    unresolvedErrors: errorLogs.filter((l) => !l.resolved).length,
    bySeverity,
    byType,
    criticalErrors,
  };
}
