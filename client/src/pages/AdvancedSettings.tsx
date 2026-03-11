import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Copy, Eye, EyeOff, Plus, Trash2, RotateCw, CheckCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";

const toast = (options: { title: string; description: string; variant?: string }) => {
  console.log(options);
  alert(`${options.title}: ${options.description}`);
};

export default function AdvancedSettings() {
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [newApiKey, setNewApiKey] = useState({ name: "", type: "openai", key: "" });
  const [testingKey, setTestingKey] = useState<string | null>(null);

  // Fetch preferences
  const { data: preferences, isLoading: prefsLoading } = trpc.advancedSettings.getPreferences.useQuery();
  const { data: apiKeys, isLoading: keysLoading } = trpc.advancedSettings.getAPIKeys.useQuery();
  const { data: notifications } = trpc.advancedSettings.getNotificationPreferences.useQuery();
  const { data: auditLog } = trpc.advancedSettings.getAuditLog.useQuery({ limit: 10 });

  // Mutations
  const updatePrefsMutation = trpc.advancedSettings.updatePreferences.useMutation();
  const addKeyMutation = trpc.advancedSettings.addAPIKey.useMutation();
  const testKeyMutation = trpc.advancedSettings.testAPIKey.useMutation();
  const revokeKeyMutation = trpc.advancedSettings.revokeAPIKey.useMutation();
  const rotateKeyMutation = trpc.advancedSettings.rotateAPIKey.useMutation();
  const updateVoiceMutation = trpc.advancedSettings.updateVoicePreferences.useMutation();
  const updateVideoMutation = trpc.advancedSettings.updateVideoPreferences.useMutation();
  const updatePrivacyMutation = trpc.advancedSettings.updatePrivacySettings.useMutation();
  const updateAdvancedMutation = trpc.advancedSettings.updateAdvancedSettings.useMutation();
  const exportSettingsMutation = trpc.advancedSettings.exportSettings.useQuery();
  const resetSettingsMutation = trpc.advancedSettings.resetSettingsToDefaults.useMutation();

  const handleAddApiKey = async () => {
    if (!newApiKey.name || !newApiKey.key) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    try {
      await addKeyMutation.mutateAsync({
        name: newApiKey.name,
        type: newApiKey.type as any,
        key: newApiKey.key,
      });
      setNewApiKey({ name: "", type: "openai", key: "" });
      toast({ title: "Success", description: "API key added successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add API key", variant: "destructive" });
    }
  };

  const handleTestApiKey = async (keyId: string) => {
    setTestingKey(keyId);
    try {
      const result = await testKeyMutation.mutateAsync({
        type: "openai",
        key: "test-key",
      });
      if (result.valid) {
        toast({ title: "Success", description: result.message });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to test API key", variant: "destructive" });
    } finally {
      setTestingKey(null);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await revokeKeyMutation.mutateAsync({ keyId });
      toast({ title: "Success", description: "API key revoked" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to revoke API key", variant: "destructive" });
    }
  };

  const handleRotateKey = async (keyId: string) => {
    try {
      await rotateKeyMutation.mutateAsync({ keyId });
      toast({ title: "Success", description: "API key rotated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to rotate API key", variant: "destructive" });
    }
  };

  const handleExportSettings = async () => {
    try {
      const result = await exportSettingsMutation.refetch();
      if (result.data?.data) {
        const blob = new Blob([result.data.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.filename || "settings.json";
        a.click();
        toast({ title: "Success", description: "Settings exported" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to export settings", variant: "destructive" });
    }
  };

  const handleResetSettings = async () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      try {
        await resetSettingsMutation.mutateAsync();
        toast({ title: "Success", description: "Settings reset to defaults" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to reset settings", variant: "destructive" });
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto">
        <div className="container max-w-6xl py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Advanced Settings</h1>
            <p className="text-slate-400">Manage API keys, notifications, and system preferences</p>
          </div>

          <Tabs defaultValue="api-keys" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-800 border border-slate-700">
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
              <TabsTrigger value="backup">Backup</TabsTrigger>
            </TabsList>

            {/* API Keys Tab */}
            <TabsContent value="api-keys" className="space-y-6 mt-6">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Add New API Key</CardTitle>
                  <CardDescription>Add credentials for external services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-slate-300">Key Name</Label>
                      <Input
                        placeholder="e.g., OpenAI Production"
                        value={newApiKey.name}
                        onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Service Type</Label>
                      <Select value={newApiKey.type} onValueChange={(value) => setNewApiKey({ ...newApiKey, type: value })}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="piapi">PiAPI</SelectItem>
                          <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                          <SelectItem value="creatomate">Creatomate</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">API Key</Label>
                      <div className="relative">
                        <Input
                          type={showApiKey["new"] ? "text" : "password"}
                          placeholder="sk-..."
                          value={newApiKey.key}
                          onChange={(e) => setNewApiKey({ ...newApiKey, key: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white pr-10"
                        />
                        <button
                          onClick={() => setShowApiKey({ ...showApiKey, new: !showApiKey["new"] })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                          {showApiKey["new"] ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleAddApiKey} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    <Plus size={18} className="mr-2" />
                    Add API Key
                  </Button>
                </CardContent>
              </Card>

              {/* Existing API Keys */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Your API Keys</h3>
                {keysLoading ? (
                  <p className="text-slate-400">Loading API keys...</p>
                ) : apiKeys && apiKeys.length > 0 ? (
                  apiKeys.map((key) => (
                    <Card key={key.id} className="bg-slate-900 border-slate-700">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">{key.name}</p>
                              <p className="text-sm text-slate-400">{key.type.toUpperCase()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {key.status === "active" ? (
                                <span className="flex items-center gap-1 text-green-400 text-sm">
                                  <CheckCircle size={16} /> Active
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-400 text-sm">
                                  <AlertTriangle size={16} /> Inactive
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-800 p-3 rounded flex items-center justify-between">
                            <code className="text-sm text-slate-300">{key.maskedKey}</code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(key.maskedKey);
                                toast({ title: "Copied", description: "Masked key copied to clipboard" });
                              }}
                              className="text-slate-400 hover:text-slate-200"
                            >
                              <Copy size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Usage</p>
                              <p className="text-white font-semibold">{key.usageCount} requests</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Rate Limit</p>
                              <p className="text-white font-semibold">{key.rateLimitRemaining}/{key.rateLimit}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleTestApiKey(key.id)}
                              disabled={testingKey === key.id}
                              variant="outline"
                              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                            >
                              Test
                            </Button>
                            <Button
                              onClick={() => handleRotateKey(key.id)}
                              variant="outline"
                              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                            >
                              <RotateCw size={16} className="mr-2" />
                              Rotate
                            </Button>
                            <Button
                              onClick={() => handleRevokeKey(key.id)}
                              variant="destructive"
                              className="flex-1"
                            >
                              <Trash2 size={16} className="mr-2" />
                              Revoke
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Alert className="bg-slate-800 border-slate-700">
                    <AlertCircle className="h-4 w-4 text-slate-400" />
                    <AlertDescription className="text-slate-300">No API keys configured yet</AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6 mt-6">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Notification Preferences</CardTitle>
                  <CardDescription>Configure how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div key={notif.id} className="space-y-4 pb-4 border-b border-slate-700 last:border-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white capitalize">{notif.type} Notifications</p>
                            <p className="text-sm text-slate-400">Frequency: {notif.frequency}</p>
                          </div>
                          <Switch checked={notif.enabled} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400">No notification preferences configured</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6 mt-6">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">General Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Theme</Label>
                      <Select value={preferences?.theme || "dark"}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Language</Label>
                      <Select value={preferences?.language || "en"}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="vi">Tiếng Việt</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Video Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-slate-300">Resolution</Label>
                      <Select value={preferences?.videoPreferences.resolution || "1080p"}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="720p">720p</SelectItem>
                          <SelectItem value="1080p">1080p</SelectItem>
                          <SelectItem value="2k">2K</SelectItem>
                          <SelectItem value="4k">4K</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">FPS</Label>
                      <Select value={String(preferences?.videoPreferences.fps || 30)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="24">24 FPS</SelectItem>
                          <SelectItem value="30">30 FPS</SelectItem>
                          <SelectItem value="60">60 FPS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Format</Label>
                      <Select value={preferences?.videoPreferences.format || "mp4"}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="mp4">MP4</SelectItem>
                          <SelectItem value="webm">WebM</SelectItem>
                          <SelectItem value="mov">MOV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Bitrate</Label>
                      <Select value={preferences?.videoPreferences.bitrate || "high"}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Privacy Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Share Analytics</Label>
                    <Switch checked={preferences?.privacySettings.shareAnalytics || false} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Share Usage Data</Label>
                    <Switch checked={preferences?.privacySettings.shareUsageData || false} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Allow Third-Party Integration</Label>
                    <Switch checked={preferences?.privacySettings.allowThirdPartyIntegration || false} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Log Tab */}
            <TabsContent value="audit" className="space-y-6 mt-6">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Audit Log</CardTitle>
                  <CardDescription>Recent changes to your settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditLog && auditLog.length > 0 ? (
                      auditLog.map((log) => (
                        <div key={log.id} className="flex items-start justify-between pb-4 border-b border-slate-700 last:border-0">
                          <div>
                            <p className="text-white font-medium">{log.action}</p>
                            <p className="text-sm text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                          </div>
                          {log.ipAddress && <p className="text-xs text-slate-500">{log.ipAddress}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400">No audit log entries</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Backup Tab */}
            <TabsContent value="backup" className="space-y-6 mt-6">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Backup & Restore</CardTitle>
                  <CardDescription>Export or reset your settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleExportSettings} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Export Settings
                  </Button>
                  <Button onClick={handleResetSettings} variant="destructive" className="w-full">
                    Reset to Defaults
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
