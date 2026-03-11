import { useState } from "react";
import { useLocation } from "wouter";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ProjectFormData {
  topic: string;
  sceneCount: number;
  duration: number;
  voiceId?: string;
  imageModel: "qwen" | "flux1-schnell";
  videoModel: "veo3-image-to-video" | "kling-image-to-video";
  autoPublish: boolean;
}

export function ProjectCreationForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const createProjectMutation = trpc.project.create.useMutation();
  const [formData, setFormData] = useState<ProjectFormData>({
    topic: "",
    sceneCount: 5,
    duration: 60,
    imageModel: "flux1-schnell",
    videoModel: "veo3-image-to-video",
    autoPublish: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.topic.trim()) {
      toast.error("Vui lòng nhập chủ đề video");
      return;
    }

    if (formData.topic.length < 10) {
      toast.error("Chủ đề phải có ít nhất 10 ký tự");
      return;
    }

    setLoading(true);
    try {
      const result = await createProjectMutation.mutateAsync({
        topic: formData.topic,
        sceneCount: formData.sceneCount,
        videoDuration: formData.duration,
        voicePreset: formData.voiceId || "alloy",
        autoPublish: formData.autoPublish,
      });

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setFormData({
          topic: "",
          sceneCount: 5,
          duration: 60,
          imageModel: "flux1-schnell",
          videoModel: "veo3-image-to-video",
          autoPublish: false,
        });
        // Navigate to project details page
        setLocation(`/project/${result.projectId}`);
      } else {
        toast.error(result.error || "Lỗi khi tạo dự án");
      }
    } catch (error) {
      toast.error("Lỗi khi tạo dự án: " + String(error));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-amber-500 hover:bg-amber-600">
          + Tạo Dự Án Mới
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo Dự Án Video Mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin để tạo video AI tự động
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic Input */}
          <div className="space-y-2">
            <Label htmlFor="topic">Chủ Đề Video *</Label>
            <Input
              id="topic"
              placeholder="Ví dụ: Cách làm bánh chocolate ngon..."
              value={formData.topic}
              onChange={(e) =>
                setFormData({ ...formData, topic: e.target.value })
              }
              disabled={loading}
              className="bg-slate-900 border-slate-700"
            />
            <p className="text-xs text-slate-400">
              Mô tả chi tiết chủ đề video để AI tạo kịch bản tốt hơn
            </p>
          </div>

          {/* Scene Count */}
          <div className="space-y-2">
            <Label htmlFor="sceneCount">Số Cảnh</Label>
            <Input
              id="sceneCount"
              type="number"
              min="1"
              max="20"
              value={formData.sceneCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sceneCount: parseInt(e.target.value) || 1,
                })
              }
              disabled={loading}
              className="bg-slate-900 border-slate-700"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Độ Dài Video (giây)</Label>
            <Input
              id="duration"
              type="number"
              min="30"
              max="600"
              step="30"
              value={formData.duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: parseInt(e.target.value) || 60,
                })
              }
              disabled={loading}
              className="bg-slate-900 border-slate-700"
            />
          </div>

          {/* Image Model */}
          <div className="space-y-2">
            <Label htmlFor="imageModel">Mô Hình Tạo Hình Ảnh</Label>
            <Select
              value={formData.imageModel}
              onValueChange={(value: any) =>
                setFormData({ ...formData, imageModel: value })
              }
              disabled={loading}
            >
              <SelectTrigger className="bg-slate-900 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flux1-schnell">Flux 1.0 Schnell</SelectItem>
                <SelectItem value="qwen">Qwen VL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Video Model */}
          <div className="space-y-2">
            <Label htmlFor="videoModel">Mô Hình Tạo Video</Label>
            <Select
              value={formData.videoModel}
              onValueChange={(value: any) =>
                setFormData({ ...formData, videoModel: value })
              }
              disabled={loading}
            >
              <SelectTrigger className="bg-slate-900 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="veo3-image-to-video">Veo 3</SelectItem>
                <SelectItem value="kling-image-to-video">Kling</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto Publish */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoPublish"
              checked={formData.autoPublish}
              onChange={(e) =>
                setFormData({ ...formData, autoPublish: e.target.checked })
              }
              disabled={loading}
              className="rounded border-slate-700"
            />
            <Label htmlFor="autoPublish" className="cursor-pointer">
              Tự động đăng lên YouTube sau khi hoàn thành
            </Label>
          </div>

          {/* Workflow Preview */}
          <Card className="bg-slate-900 border-slate-700 p-4">
            <h4 className="font-semibold text-sm mb-3">Quy Trình Xử Lý:</h4>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center mr-3">
                  1
                </span>
                Tạo kịch bản từ chủ đề
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center mr-3">
                  2
                </span>
                Sinh hình ảnh AI (song song)
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center mr-3">
                  3
                </span>
                Tạo video từ hình ảnh (song song)
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center mr-3">
                  4
                </span>
                Tạo giọng đọc
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center mr-3">
                  5
                </span>
                Ghép video cuối cùng
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center mr-3">
                  6
                </span>
                Đăng lên YouTube
              </div>
            </div>
          </Card>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Đang tạo..." : "Tạo Dự Án"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
