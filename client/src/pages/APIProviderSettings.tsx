import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Check, DollarSign, Zap, Download } from "lucide-react";
import { toast } from "sonner";

export function APIProviderSettings() {
  const [selectedProviders, setSelectedProviders] = useState<Record<string, string>>({});
  const [budget, setBudget] = useState(50);
  const [videosPerDay, setVideosPerDay] = useState(10);

  const { data: allProviders } = trpc.apiProvider.getAll.useQuery();
  const { data: freeProviders } = trpc.apiProvider.getFree.useQuery();
  const { data: costComparison } = trpc.apiProvider.getCostComparison.useQuery();
  const { data: costResult } = trpc.apiProvider.calculateCost.useQuery(
    {
      providers: selectedProviders,
      videosPerDay,
    },
    { enabled: Object.keys(selectedProviders).length > 0 }
  );
  const { data: scenarios } = trpc.apiProvider.estimateScenarios.useQuery();
  const utils = trpc.useUtils();

  const { data: providerCatalog } = trpc.hybridProvider.catalog.useQuery();
  const { data: providerConfigs } = trpc.hybridProvider.getConfigs.useQuery();
  const { data: localTools, refetch: refetchLocalTools } = trpc.hybridProvider.detectLocalTools.useQuery();

  const upsertProviderConfigMutation = trpc.hybridProvider.upsertConfig.useMutation({
    onSuccess: async () => {
      await utils.hybridProvider.getConfigs.invalidate();
      toast.success("Đã lưu cấu hình provider");
    },
    onError: (error) => toast.error(error.message || "Lưu provider thất bại"),
  });

  const installToolInstructionMutation = trpc.hybridProvider.installToolInstructions.useMutation({
    onSuccess: (result) => {
      navigator.clipboard?.writeText(result.installCommand);
      toast.success(`Đã copy lệnh cài ${result.toolId} vào clipboard`);
    },
    onError: (error) => toast.error(error.message || "Lấy lệnh cài thất bại"),
  });

  const handleProviderSelect = (type: string, providerId: string) => {
    setSelectedProviders((prev) => ({
      ...prev,
      [type]: providerId,
    }));
  };

  const handleApplyScenario = (scenario: Record<string, string>) => {
    setSelectedProviders(scenario);
  };

  const handleDownloadGuide = (providerId: string) => {
    // In a real app, this would trigger a download
    alert(`Setup guide for ${providerId} would be downloaded`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">API Provider Settings</h1>
          <p className="text-muted-foreground">
            Choose your API providers to optimize cost and performance
          </p>
        </div>

        {/* Cost Summary */}
        {costResult && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Cost</p>
                  <p className="text-2xl font-bold">${costResult.totalCost}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Potential Savings</p>
                  <p className="text-2xl font-bold text-green-500">${costResult.savings}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Videos/Day</p>
                  <p className="text-2xl font-bold">{videosPerDay}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual Cost</p>
                  <p className="text-2xl font-bold">${(costResult.totalCost * 12).toFixed(2)}</p>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">Cost Breakdown by Service:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(costResult.breakdown || {}).map(([type, cost]) => (
                    <div key={type} className="text-sm p-2 bg-background rounded">
                      <p className="capitalize font-medium">{type}</p>
                      <p className="text-muted-foreground">${cost.toFixed(2)}/month</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Hybrid Provider Manager</CardTitle>
            <CardDescription>
              Chọn provider cloud/local cho từng stage: script, image, voice, render.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["script", "image", "voice", "render"] as const).map((category) => {
              const options = (providerCatalog as any)?.[category] || [];
              const active = (providerConfigs || []).find((c: any) => c.category === category && c.isActive);
              return (
                <div key={category} className="border rounded-lg p-3 space-y-2">
                  <p className="font-medium capitalize">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {options.map((opt: any) => {
                      const isActive = active?.providerId === opt.id;
                      return (
                        <Button
                          key={`${category}-${opt.id}`}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            upsertProviderConfigMutation.mutate({
                              category,
                              providerId: opt.id,
                              mode: opt.mode,
                            })
                          }
                        >
                          {opt.id} ({opt.mode})
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Local AI Setup Wizard</CardTitle>
            <CardDescription>Cài Ollama, Stable Diffusion, FFmpeg, Whisper, Coqui TTS cho local-only mode.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetchLocalTools()}>
                Kiểm tra local tools
              </Button>
            </div>

            <div className="grid gap-2">
              {(localTools || []).map((tool: any) => (
                <div key={tool.id} className="border rounded-lg p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{tool.id}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{tool.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={tool.installed ? "default" : "secondary"}>
                      {tool.installed ? "Installed" : "Missing"}
                    </Badge>
                    {!tool.installed && (
                      <Button
                        size="sm"
                        onClick={() => installToolInstructionMutation.mutate({ toolId: tool.id })}
                      >
                        Copy install cmd
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preset Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle>Preset Scenarios</CardTitle>
            <CardDescription>Choose a pre-configured setup to get started quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios?.scenarios &&
                Object.entries(scenarios.scenarios).map(([name, scenario]: any) => (
                  <Card key={name} className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader>
                      <CardTitle className="text-base">{name}</CardTitle>
                      <CardDescription>{scenario.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="font-medium">Script:</span> {scenario.script}
                        </p>
                        <p>
                          <span className="font-medium">Voice:</span> {scenario.voice}
                        </p>
                        <p>
                          <span className="font-medium">Image:</span> {scenario.image}
                        </p>
                        <p>
                          <span className="font-medium">Video:</span> {scenario.video}
                        </p>
                        <p>
                          <span className="font-medium">Music:</span> {scenario.music}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <p className="font-bold">${scenario.monthlyCost}/month</p>
                        <Button
                          size="sm"
                          onClick={() => handleApplyScenario(scenario)}
                        >
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Provider Selection */}
        <Tabs defaultValue="script" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="script">Script</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          {allProviders &&
            Object.entries(allProviders.providers || {}).map(([type, providers]: any) => (
              <TabsContent key={type} value={type} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {providers.map((provider: any) => (
                    <Card
                      key={provider.id}
                      className={`cursor-pointer transition-all ${
                        selectedProviders[type] === provider.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => handleProviderSelect(type, provider.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base">{provider.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {provider.notes}
                            </CardDescription>
                          </div>
                          {selectedProviders[type] === provider.id && (
                            <Check className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          {provider.isFree && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-700">
                              FREE
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            Quality: {provider.quality}/10
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Speed: {provider.speed}/10
                          </Badge>
                        </div>

                        {/* Cost */}
                        <div className="text-sm">
                          <p className="text-muted-foreground">Cost</p>
                          <p className="font-bold">
                            {provider.isFree ? "FREE" : `$${provider.costPerUnit}/${provider.unit}`}
                          </p>
                        </div>

                        {/* Setup Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadGuide(provider.id);
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Setup Guide
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
        </Tabs>

        {/* Free Providers Summary */}
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-500" />
              100% Free Setup Available
            </CardTitle>
            <CardDescription>
              You can run this entire system for FREE using open-source and free APIs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {freeProviders &&
                Object.entries(freeProviders).map(([type, providers]: any) => (
                  <div key={type} className="p-3 bg-background rounded-lg">
                    <p className="capitalize font-semibold text-sm">{type}</p>
                    <div className="space-y-1 mt-2">
                      {Array.isArray(providers) && providers.slice(0, 2).map((p: any) => (
                        <p key={p.id} className="text-xs text-muted-foreground">
                          ✓ {p.name}
                        </p>
                      ))}
                      {Array.isArray(providers) && providers.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{providers.length - 2} more options
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Videos per Day</label>
              <input
                type="range"
                min="1"
                max="100"
                value={videosPerDay}
                onChange={(e) => setVideosPerDay(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">{videosPerDay} videos/day</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Budget</label>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">${budget}/month</p>
            </div>

            <Button className="w-full">Save Settings</Button>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="w-5 h-5" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-yellow-700">
            <p>
              • Free options may require self-hosting and technical setup. Ensure you have the
              infrastructure to support them.
            </p>
            <p>
              • API rate limits apply to free tiers. Monitor usage to avoid hitting limits.
            </p>
            <p>
              • Quality may vary between providers. Test with a small batch before scaling.
            </p>
            <p>
              • Always keep API keys secure and rotate them regularly.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default APIProviderSettings;
