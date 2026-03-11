import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface ErrorRecoveryProps {
  error: {
    title: string;
    message: string;
    icon: string;
    suggestions?: Array<{
      suggestion: string;
      action: string;
      priority: "low" | "medium" | "high";
    }>;
  };
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
}

export function ErrorRecovery({
  error,
  onRetry,
  onDismiss,
  isRetrying = false,
}: ErrorRecoveryProps) {
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);

  const handleCopyError = () => {
    const errorText = `${error.title}\n${error.message}`;
    navigator.clipboard.writeText(errorText);
    toast.success("Error copied to clipboard");
  };

  return (
    <Card className="border-red-500/20 bg-red-500/5 w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{error.icon}</div>
            <div>
              <CardTitle className="text-lg text-red-600">{error.title}</CardTitle>
              <CardDescription className="text-red-600/80 mt-1">{error.message}</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-200"
          >
            ✕
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Suggestions */}
        {error.suggestions && error.suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-300">Suggested Actions:</h4>
            <div className="space-y-2">
              {error.suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/50 rounded-lg border border-slate-800 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedSuggestion(expandedSuggestion === idx ? null : idx)
                    }
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          suggestion.priority === "high"
                            ? "bg-red-500"
                            : suggestion.priority === "medium"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <span className="text-sm text-slate-300">{suggestion.suggestion}</span>
                    </div>
                    {expandedSuggestion === idx ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {expandedSuggestion === idx && (
                    <div className="border-t border-slate-800 p-3 bg-slate-950/50">
                      <p className="text-sm text-slate-400 mb-3">{suggestion.action}</p>
                      <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700">
                        {suggestion.action}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                "Retry"
              )}
            </Button>
          )}
          <Button
            onClick={handleCopyError}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Error
          </Button>
        </div>

        {/* Help Text */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-200">
          <strong>Need help?</strong> If the problem persists, contact support with the error details
          copied above.
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Error Toast Component
 */
export function ErrorToast({
  error,
  onRetry,
}: {
  error: { title: string; message: string; icon: string };
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
      <div className="text-xl flex-shrink-0">{error.icon}</div>
      <div className="flex-1">
        <div className="font-semibold text-red-600">{error.title}</div>
        <div className="text-sm text-red-600/80 mt-1">{error.message}</div>
      </div>
      {onRetry && (
        <Button
          size="sm"
          onClick={onRetry}
          className="flex-shrink-0 bg-red-600 hover:bg-red-700"
        >
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * Error Boundary Component
 */
export function ErrorBoundaryFallback({ error, resetError }: any) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="border-red-500/20 bg-red-500/5 max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <CardTitle className="text-red-600">Something went wrong</CardTitle>
              <CardDescription className="text-red-600/80">
                An unexpected error occurred
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-300 font-mono overflow-auto max-h-32">
            {error?.message || "Unknown error"}
          </div>
          <div className="flex gap-2">
            <Button onClick={resetError} className="flex-1 bg-amber-600 hover:bg-amber-700">
              Try Again
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              className="flex-1"
            >
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
