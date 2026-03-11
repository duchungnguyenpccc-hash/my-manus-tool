import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

interface ApiKeyStatusIndicatorProps {
  hasAllKeys: boolean;
  missingProviders?: string[];
}

export function ApiKeyStatusIndicator({ hasAllKeys, missingProviders = [] }: ApiKeyStatusIndicatorProps) {
  const [, navigate] = useLocation();

  if (hasAllKeys) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        <span className="text-sm text-green-600">All API keys configured</span>
      </div>
    );
  }

  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <CardTitle className="text-base">Setup Required</CardTitle>
              <CardDescription className="text-amber-600/80">
                {missingProviders.length > 0
                  ? `Missing: ${missingProviders.join(", ")}`
                  : "Configure API keys to start creating videos"}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => navigate("/settings")}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          Configure API Keys
        </Button>
      </CardContent>
    </Card>
  );
}
