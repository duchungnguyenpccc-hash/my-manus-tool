import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { OnboardingWizard } from "./OnboardingWizard";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { isAuthenticated } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has completed onboarding
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    // Check if user has API keys configured
    const checkApiKeys = async () => {
      try {
        // This would call a tRPC procedure to check if user has any API keys
        // For now, we'll show onboarding if no keys are found
        const hasApiKeys = localStorage.getItem("onboarding_completed");
        if (!hasApiKeys) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error("Error checking API keys:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkApiKeys();
  }, [isAuthenticated]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem("onboarding_completed", "true");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showOnboarding && <OnboardingWizard />}
      {children}
    </>
  );
}
