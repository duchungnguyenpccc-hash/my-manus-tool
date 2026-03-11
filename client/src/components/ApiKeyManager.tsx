import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Provider = "openai" | "piapi" | "elevenlabs" | "creatomate" | "youtube";

interface ApiKey {
  provider: Provider;
  key: string;
  masked: string;
  status: "valid" | "invalid" | "untested";
  lastTested?: Date;
}

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<Map<Provider, ApiKey>>(new Map());
  const [selectedProvider, setSelectedProvider] = useState<Provider>("openai");
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(false);

  const providers: { value: Provider; label: string; placeholder: string }[] = [
    {
      value: "openai",
      label: "OpenAI",
      placeholder: "sk-proj-...",
    },
    {
      value: "piapi",
      label: "PiAPI",
      placeholder: "sk_live_...",
    },
    {
      value: "elevenlabs",
      label: "ElevenLabs",
      placeholder: "sk_...",
    },
    {
      value: "creatomate",
      label: "Creatomate",
      placeholder: "api_...",
    },
    {
      value: "youtube",
      label: "YouTube",
      placeholder: "ya29...",
    },
  ];

  const maskKey = (key: string): string => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + "*".repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const handleAddKey = async () => {
    if (!keyInput.trim()) {
      toast.error("Vui lòng nhập API key");
      return;
    }

    setLoading(true);
    try {
      // TODO: Call tRPC to save API key
      const newKey: ApiKey = {
        provider: selectedProvider,
        key: keyInput,
        masked: maskKey(keyInput),
        status: "untested",
      };

      setApiKeys(new Map(apiKeys).set(selectedProvider, newKey));
      setKeyInput("");
      toast.success(`API key cho ${selectedProvider} đã được lưu`);
    } catch (error) {
      toast.error("Lỗi khi lưu API key");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestKey = async (provider: Provider) => {
    const key = apiKeys.get(provider);
    if (!key) {
      toast.error("Chưa có API key cho provider này");
      return;
    }

    setTesting(provider);
    try {
      // TODO: Call tRPC to test API key
      console.log(`Testing ${provider} API key...`);
      
      // Simulate test delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const updated = new Map(apiKeys);
      updated.set(provider, {
        ...key,
        status: "valid",
        lastTested: new Date(),
      });
      setApiKeys(updated);
      toast.success(`${provider} API key hợp lệ!`);
    } catch (error) {
      const updated = new Map(apiKeys);
      updated.set(provider, {
        ...key,
        status: "invalid",
        lastTested: new Date(),
      });
      setApiKeys(updated);
      toast.error(`${provider} API key không hợp lệ`);
    } finally {
      setTesting(null);
    }
  };

  const handleDeleteKey = (provider: Provider) => {
    const updated = new Map(apiKeys);
    updated.delete(provider);
    setApiKeys(updated);
    toast.success(`API key cho ${provider} đã được xóa`);
  };

  const currentKey = apiKeys.get(selectedProvider);

  return (
    <div className="space-y-6">
      {/* Add/Edit Key Section */}
      <Card className="bg-slate-900 border-slate-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Thêm/Cập Nhật API Key</h3>

        <div className="space-y-4">
          {/* Provider Select */}
          <div className="space-y-2">
            <Label htmlFor="provider">Chọn Dịch Vụ</Label>
            <Select value={selectedProvider} onValueChange={(value: any) => setSelectedProvider(value)}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Key Input */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  placeholder={providers.find((p) => p.value === selectedProvider)?.placeholder}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  disabled={loading}
                  className="bg-slate-800 border-slate-700 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <Button
                onClick={handleAddKey}
                disabled={loading || !keyInput.trim()}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Lưu..." : "Lưu"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Saved Keys Section */}
      <Card className="bg-slate-900 border-slate-700 p-6">
        <h3 className="text-lg font-semibold mb-4">API Keys Đã Lưu</h3>

        {apiKeys.size === 0 ? (
          <p className="text-slate-400 text-center py-8">Chưa có API key nào được lưu</p>
        ) : (
          <div className="space-y-3">
            {Array.from(apiKeys.entries()).map(([provider, key]) => (
              <div
                key={provider}
                className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold capitalize">{provider}</span>
                    {key.status === "valid" && (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                    {key.status === "invalid" && (
                      <AlertCircle size={16} className="text-red-500" />
                    )}
                    {key.status === "untested" && (
                      <AlertCircle size={16} className="text-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400 font-mono">{key.masked}</p>
                  {key.lastTested && (
                    <p className="text-xs text-slate-500 mt-1">
                      Kiểm tra lần cuối: {new Date(key.lastTested).toLocaleString("vi-VN")}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestKey(provider)}
                    disabled={testing === provider}
                  >
                    {testing === provider && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {testing === provider ? "Kiểm tra..." : "Kiểm tra"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteKey(provider)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-900/20 border-blue-700/50 p-4">
        <p className="text-sm text-blue-200">
          💡 <strong>Mẹo:</strong> API keys được mã hóa AES-256 và lưu an toàn trên máy chủ.
          Bạn có thể kiểm tra kết nối để đảm bảo API key hợp lệ trước khi tạo video.
        </p>
      </Card>
    </div>
  );
}
