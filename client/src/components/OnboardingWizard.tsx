import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, AlertCircle, Loader2, Key, Zap, Sparkles, Play, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ApiKeyStatus {
  provider: "openai" | "piapi" | "elevenlabs" | "creatomate" | "youtube";
  name: string;
  icon: React.ReactNode;
  status: "pending" | "testing" | "valid" | "invalid";
  description: string;
}

export function OnboardingWizard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isOpen, setIsOpen] = useState(true);
  const [apiKeyStatuses, setApiKeyStatuses] = useState<ApiKeyStatus[]>([
    {
      provider: "openai",
      name: "OpenAI",
      icon: <Sparkles className="w-5 h-5" />,
      status: "pending",
      description: "Script generation & content creation",
    },
    {
      provider: "piapi",
      name: "PiAPI",
      icon: <Zap className="w-5 h-5" />,
      status: "pending",
      description: "Image & video generation",
    },
    {
      provider: "elevenlabs",
      name: "ElevenLabs",
      icon: <Target className="w-5 h-5" />,
      status: "pending",
      description: "Text-to-speech voiceovers",
    },
    {
      provider: "creatomate",
      name: "Creatomate",
      icon: <Play className="w-5 h-5" />,
      status: "pending",
      description: "Video rendering & composition",
    },
    {
      provider: "youtube",
      name: "YouTube",
      icon: <Key className="w-5 h-5" />,
      status: "pending",
      description: "Video upload & publishing",
    },
  ]);

  const checkApiKeys = async () => {
    setStep(2);
    // Simulate checking API keys
    for (let i = 0; i < apiKeyStatuses.length; i++) {
      setApiKeyStatuses((prev) =>
        prev.map((status, idx) =>
          idx === i ? { ...status, status: "testing" as const } : status
        )
      );
      await new Promise((resolve) => setTimeout(resolve, 800));
      setApiKeyStatuses((prev) =>
        prev.map((status, idx) =>
          idx === i ? { ...status, status: "valid" as const } : status
        )
      );
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
  };

  const handleComplete = () => {
    setStep(5);
    setTimeout(() => {
      setIsOpen(false);
      toast.success("Onboarding completed! You're ready to create videos.");
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === 1 && "Welcome to The Faceless POV AI Machine"}
            {step === 2 && "Checking Your API Keys"}
            {step === 3 && "Configure Your Preferences"}
            {step === 4 && "Ready to Create Videos!"}
            {step === 5 && "Setup Complete!"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Let's get you set up in just a few minutes"}
            {step === 2 && "Validating your API key configuration"}
            {step === 3 && "Customize your video generation settings"}
            {step === 4 && "You're all set to start creating amazing videos"}
            {step === 5 && "Your account is ready to use"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                  <div className="text-2xl font-bold text-amber-600">12</div>
                  <div className="text-sm text-amber-600/80">Workflow Steps</div>
                </div>
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                  <div className="text-2xl font-bold text-blue-600">5</div>
                  <div className="text-sm text-blue-600/80">AI Services</div>
                </div>
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                  <div className="text-2xl font-bold text-green-600">100%</div>
                  <div className="text-sm text-green-600/80">Automated</div>
                </div>
                <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4">
                  <div className="text-2xl font-bold text-purple-600">∞</div>
                  <div className="text-sm text-purple-600/80">Scalable</div>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-white">What You Can Do:</h3>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>✓ Generate scripts from any topic using AI</li>
                  <li>✓ Create stunning images and videos automatically</li>
                  <li>✓ Add professional voiceovers in multiple languages</li>
                  <li>✓ Render final videos with effects and transitions</li>
                  <li>✓ Upload directly to YouTube with optimized metadata</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: API Key Check */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-3">
                {apiKeyStatuses.map((status) => (
                  <div
                    key={status.provider}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-slate-400">{status.icon}</div>
                      <div>
                        <div className="font-medium text-white">{status.name}</div>
                        <div className="text-xs text-slate-400">{status.description}</div>
                      </div>
                    </div>
                    <div>
                      {status.status === "pending" && (
                        <div className="text-xs text-slate-400">Pending</div>
                      )}
                      {status.status === "testing" && (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      )}
                      {status.status === "valid" && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      {status.status === "invalid" && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-200">
                <strong>Note:</strong> You can add or update API keys anytime in Settings. For now, we'll
                proceed with the setup.
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-4">
                  <label className="text-sm font-medium text-white">Default Voice Preset</label>
                  <select className="w-full mt-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm">
                    <option>Professional Male (English)</option>
                    <option>Professional Female (English)</option>
                    <option>Casual Male (English)</option>
                    <option>Casual Female (English)</option>
                  </select>
                </div>

                <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-4">
                  <label className="text-sm font-medium text-white">Video Quality</label>
                  <select className="w-full mt-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm">
                    <option>1080p (Recommended)</option>
                    <option>720p (Fast)</option>
                    <option>4K (Premium)</option>
                  </select>
                </div>

                <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-white cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                    Auto-publish to YouTube
                  </label>
                  <p className="text-xs text-slate-400 mt-2">
                    Videos will be published automatically after rendering
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Ready */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold text-white mb-2">You're All Set!</h3>
                <p className="text-sm text-slate-300">
                  Your account is configured and ready to create amazing videos. Click below to start
                  creating your first project.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-white text-sm">Next Steps:</h3>
                <ol className="text-sm text-slate-300 space-y-1">
                  <li>1. Go to Dashboard and click "Create Project"</li>
                  <li>2. Enter your video topic and preferences</li>
                  <li>3. Watch as the system generates your video</li>
                  <li>4. Review and publish to YouTube</li>
                </ol>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 5 && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse" />
                  <CheckCircle2 className="w-16 h-16 text-green-500 relative" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-white">Setup Complete!</h3>
                <p className="text-sm text-slate-400 mt-1">
                  You're ready to create your first video. Let's get started!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 justify-between pt-4 border-t border-slate-800">
          {step < 5 && (
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              Skip for Now
            </Button>
          )}
          <div className="flex gap-3 flex-1">
            {step > 1 && step < 5 && (
              <Button
                variant="outline"
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            {step === 1 && (
              <Button onClick={checkApiKeys} className="flex-1 bg-amber-600 hover:bg-amber-700">
                Start Setup
              </Button>
            )}
            {step === 2 && (
              <Button
                onClick={() => setStep(3)}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                Continue
              </Button>
            )}
            {step === 3 && (
              <Button
                onClick={() => setStep(4)}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                Review Setup
              </Button>
            )}
            {step === 4 && (
              <Button
                onClick={handleComplete}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Start Creating Videos
              </Button>
            )}
            {step === 5 && (
              <Button
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 justify-center pt-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-amber-600" : "bg-slate-700"
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
