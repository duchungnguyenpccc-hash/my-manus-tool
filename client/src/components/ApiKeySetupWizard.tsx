import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type ApiProvider = "openai" | "piapi" | "elevenlabs" | "creatomate" | "youtube";

interface ApiKeyStep {
  provider: ApiProvider;
  title: string;
  description: string;
  placeholder: string;
  docsUrl: string;
  icon: string;
}

const API_KEY_STEPS: ApiKeyStep[] = [
  {
    provider: "openai",
    title: "OpenAI API Key",
    description: "For script and prompt generation",
    placeholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
    icon: "🤖",
  },
  {
    provider: "piapi",
    title: "PiAPI Key",
    description: "For image and video generation",
    placeholder: "pi_...",
    docsUrl: "https://piapi.ai/dashboard",
    icon: "🎨",
  },
  {
    provider: "elevenlabs",
    title: "ElevenLabs API Key",
    description: "For text-to-speech generation",
    placeholder: "sk_...",
    docsUrl: "https://elevenlabs.io/app/settings/api-keys",
    icon: "🎙️",
  },
  {
    provider: "creatomate",
    title: "Creatomate API Key",
    description: "For video rendering and composition",
    placeholder: "crt_...",
    docsUrl: "https://creatomate.com/dashboard/settings",
    icon: "🎬",
  },
  {
    provider: "youtube",
    title: "YouTube API Key",
    description: "For video upload and publishing",
    placeholder: "AIza...",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
    icon: "📺",
  },
];

export default function ApiKeySetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [apiKeys, setApiKeys] = useState<Record<ApiProvider, string>>({
    openai: "",
    piapi: "",
    elevenlabs: "",
    creatomate: "",
    youtube: "",
  });
  const [testingKey, setTestingKey] = useState<ApiProvider | null>(null);
  const [testResults, setTestResults] = useState<Record<ApiProvider, boolean | null>>({
    openai: null,
    piapi: null,
    elevenlabs: null,
    creatomate: null,
    youtube: null,
  });

  const addApiKeyMutation = trpc.apiKey.add.useMutation();
  const testApiKeyMutation = trpc.apiKey.test.useMutation();

  const currentStepData = API_KEY_STEPS[currentStep];

  const handleTestKey = async (provider: ApiProvider) => {
    const key = apiKeys[provider];
    if (!key) {
      toast.error("Please enter an API key first");
      return;
    }

    // First save the key, then test it
    setTestingKey(provider);
    try {
      // Save key first
      await addApiKeyMutation.mutateAsync({
        provider,
        apiKey: key,
      });
      
      // Then test it
      const result = await testApiKeyMutation.mutateAsync({
        provider,
      });
      setTestResults((prev) => ({
        ...prev,
        [provider]: result.isValid,
      }));
      if (result.isValid) {
        toast.success(`${provider} API key is valid!`);
      } else {
        toast.error(`${provider} API key is invalid: ${result.message}`);
      }
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: false,
      }));
      toast.error("Failed to test API key");
    } finally {
      setTestingKey(null);
    }
  };

  const handleSaveKey = async (provider: ApiProvider) => {
    const key = apiKeys[provider];
    if (!key) {
      toast.error("Please enter an API key");
      return;
    }

    // Test first
    const testResult = testResults[provider];
    if (testResult !== true) {
      toast.error("Please test the API key first");
      return;
    }

    try {
      await addApiKeyMutation.mutateAsync({
        provider,
        apiKey: key,
      });
      toast.success(`${provider} API key saved successfully!`);
      setApiKeys((prev) => ({
        ...prev,
        [provider]: "",
      }));
    } catch (error) {
      toast.error("Failed to save API key");
    }
  };

  const handleNext = () => {
    if (currentStep < API_KEY_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const allKeysConfigured = Object.values(testResults).every((v) => v === true);

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Key Setup</h1>
        <p className="text-gray-400">
          Configure your API keys to enable video generation. Step {currentStep + 1} of{" "}
          {API_KEY_STEPS.length}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex gap-2">
          {API_KEY_STEPS.map((step, index) => (
            <div
              key={step.provider}
              className={`flex-1 h-2 rounded-full transition-all ${
                index <= currentStep ? "bg-amber-500" : "bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Current Step */}
      <Card className="p-8 mb-8 border-slate-700 bg-slate-900">
        <div className="flex items-start gap-4 mb-6">
          <div className="text-4xl">{currentStepData.icon}</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{currentStepData.title}</h2>
            <p className="text-gray-400 mb-4">{currentStepData.description}</p>
            <a
              href={currentStepData.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:text-amber-400 text-sm underline"
            >
              Get your API key →
            </a>
          </div>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">API Key</label>
          <Input
            type="password"
            placeholder={currentStepData.placeholder}
            value={apiKeys[currentStepData.provider]}
            onChange={(e) =>
              setApiKeys((prev) => ({
                ...prev,
                [currentStepData.provider]: e.target.value,
              }))
            }
            className="bg-slate-800 border-slate-600"
          />
        </div>

        {/* Test & Save Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => handleTestKey(currentStepData.provider)}
            disabled={
              testingKey === currentStepData.provider ||
              !apiKeys[currentStepData.provider]
            }
            variant="outline"
            className="flex-1"
          >
            {testingKey === currentStepData.provider ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : testResults[currentStepData.provider] === true ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                Verified
              </>
            ) : testResults[currentStepData.provider] === false ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                Invalid
              </>
            ) : (
              "Test Key"
            )}
          </Button>

          {testResults[currentStepData.provider] === true && (
            <Button
              onClick={() => handleSaveKey(currentStepData.provider)}
              disabled={addApiKeyMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {addApiKeyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Key"
              )}
            </Button>
          )}
        </div>

        {/* Test Result Message */}
        {testResults[currentStepData.provider] === false && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
            This API key appears to be invalid. Please check and try again.
          </div>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-between">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          variant="outline"
        >
          ← Previous
        </Button>

        <div className="flex gap-3">
          <Button onClick={handleSkip} variant="ghost">
            Skip
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentStep === API_KEY_STEPS.length - 1}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Next →
          </Button>
        </div>
      </div>

      {/* Completion Message */}
      {currentStep === API_KEY_STEPS.length - 1 && allKeysConfigured && (
        <div className="mt-8 p-4 bg-green-900/20 border border-green-700 rounded text-green-400">
          ✓ All API keys configured! You can now start creating videos.
        </div>
      )}
    </div>
  );
}
