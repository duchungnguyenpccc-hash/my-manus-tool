import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Trash2, Plus, Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ProviderId = "openai" | "piapi" | "elevenlabs" | "creatomate" | "youtube";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("api-keys");
  const [showAddKey, setShowAddKey] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>("openai");
  const [apiKeyInput, setApiKeyInput] = useState("");

  const apiKeysQuery = trpc.apiKey.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const utils = trpc.useUtils();

  const addApiKeyMutation = trpc.apiKey.add.useMutation({
    onSuccess: async () => {
      await utils.apiKey.list.invalidate();
      toast.success("API key added successfully");
      setShowAddKey(false);
      setApiKeyInput("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add API key");
    },
  });

  const deleteApiKeyMutation = trpc.apiKey.delete.useMutation({
    onSuccess: async () => {
      await utils.apiKey.list.invalidate();
      toast.success("API key deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete API key");
    },
  });

  const testApiKeyMutation = trpc.apiKey.test.useMutation({
    onSuccess: async (result, variables) => {
      await utils.apiKey.list.invalidate();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(`${variables.provider}: ${result.message}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to test API key");
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const providers = useMemo(
    () => [
      {
        id: "openai" as const,
        name: "OpenAI",
        description: "For script and prompt generation",
        keyPrefix: "sk-",
        docs: "https://platform.openai.com/api-keys",
      },
      {
        id: "piapi" as const,
        name: "PiAPI",
        description: "For image and video generation",
        keyPrefix: "pi_",
        docs: "https://piapi.ai/docs",
      },
      {
        id: "elevenlabs" as const,
        name: "ElevenLabs",
        description: "For text-to-speech generation",
        keyPrefix: "sk_",
        docs: "https://elevenlabs.io/docs",
      },
      {
        id: "creatomate" as const,
        name: "Creatomate",
        description: "For video rendering and composition",
        keyPrefix: "ct_",
        docs: "https://creatomate.com/docs",
      },
      {
        id: "youtube" as const,
        name: "YouTube",
        description: "For automatic video uploads",
        keyPrefix: "ya29_",
        docs: "https://developers.google.com/youtube",
      },
    ],
    []
  );

  const maskApiKey = (prefix: string) => `${prefix}••••••••••••`;

  const apiKeys = apiKeysQuery.data?.keys ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400">Manage your API keys and preferences</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex gap-4 mb-8 border-b border-slate-800">
          {[
            { id: "api-keys", label: "API Keys" },
            { id: "profile", label: "Profile" },
            { id: "billing", label: "Billing" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-amber-500 text-white"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "api-keys" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">API Keys</h2>
                <p className="text-slate-400 mt-1">Manage your API credentials securely</p>
              </div>
              <Button
                onClick={() => setShowAddKey(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add API Key
              </Button>
            </div>

            <div className="grid gap-4">
              {apiKeysQuery.isLoading ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="py-8 text-center text-slate-300 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading API keys...
                  </CardContent>
                </Card>
              ) : apiKeys.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700 border-dashed">
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No API keys configured</h3>
                    <p className="text-slate-400 mb-6">Add your API keys to enable video generation features</p>
                    <Button
                      onClick={() => setShowAddKey(true)}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                    >
                      Add Your First Key
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                apiKeys.map((key) => {
                  const provider = providers.find((p) => p.id === key.provider);
                  return (
                    <Card key={key.id} className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-white">{provider?.name}</CardTitle>
                            <CardDescription className="text-slate-400">{provider?.description}</CardDescription>
                          </div>
                          {key.isActive ? (
                            <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold flex items-center gap-1 border border-green-500/20">
                              <Check className="w-3 h-3" />
                              Active
                            </div>
                          ) : (
                            <div className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 text-xs font-semibold border border-slate-500/20">
                              Inactive
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <code className="px-3 py-2 bg-slate-700/50 rounded text-sm text-slate-300 font-mono">
                              {maskApiKey(provider?.keyPrefix ?? "key_")}
                            </code>
                            <span className="text-xs text-slate-400">
                              Last tested: {key.lastTestedAt ? new Date(key.lastTestedAt).toLocaleString() : "Never"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-600"
                              onClick={() => testApiKeyMutation.mutate({ provider: key.provider as ProviderId })}
                              disabled={testApiKeyMutation.isPending}
                            >
                              Test
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:bg-red-500/10"
                              onClick={() => deleteApiKeyMutation.mutate({ keyId: key.id })}
                              disabled={deleteApiKeyMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="max-w-2xl">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name || ""}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email || ""}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="pt-4">
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="max-w-2xl">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Billing</CardTitle>
                <CardDescription>Manage your subscription and billing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">Free Plan</h3>
                        <p className="text-sm text-slate-400">Current plan</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">$0</div>
                        <p className="text-sm text-slate-400">/month</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400">
                    Upgrade to a paid plan to unlock unlimited video generation and priority support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {showAddKey && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Add API Key</CardTitle>
              <CardDescription>Select a provider and enter your API key</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value as ProviderId)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">API Key</label>
                <input
                  type="password"
                  placeholder="Paste your API key here"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="text-xs text-slate-400">
                <p className="mb-2">
                  Get your API key from{" "}
                  <a
                    href={providers.find((p) => p.id === selectedProvider)?.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300"
                  >
                    {providers.find((p) => p.id === selectedProvider)?.name} documentation
                  </a>
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-600 hover:bg-slate-700"
                  onClick={() => {
                    setShowAddKey(false);
                    setApiKeyInput("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                  onClick={() => addApiKeyMutation.mutate({ provider: selectedProvider, apiKey: apiKeyInput })}
                  disabled={addApiKeyMutation.isPending || apiKeyInput.trim().length < 10}
                >
                  {addApiKeyMutation.isPending ? "Adding..." : "Add Key"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
