import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ChevronLeft, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { ProgressTracker } from "@/components/ProgressTracker";

export default function ProjectDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/project/:id");
  const projectId = parseInt(params?.id || "0");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch project details
  const { data: projectData, isLoading, error, refetch } = trpc.project.getById.useQuery(
    { projectId },
    { enabled: !!projectId, refetchInterval: autoRefresh ? 2000 : false }
  );

  // Fetch progress
  const { data: progressData, refetch: refetchProgress } = trpc.project.getProgress.useQuery(
    { projectId },
    { enabled: !!projectId, refetchInterval: autoRefresh ? 2000 : false }
  );

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-amber-500" />
          <p className="text-slate-300">Đang tải dự án...</p>
        </div>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/dashboard")}
          className="mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Quay lại Dashboard
        </Button>

        <Card className="bg-red-950 border-red-800 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-100">Không tìm thấy dự án</h3>
              <p className="text-red-200 text-sm mt-1">
                {error?.message || "Dự án không tồn tại hoặc đã bị xóa"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const { project, tasks } = projectData;
  const isCompleted = project.status === "completed";
  const isFailed = project.status === "failed";

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/dashboard")}
          className="mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Quay lại Dashboard
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.title}</h1>
            <p className="text-slate-400">
              Tạo lúc: {new Date(project.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>

          <div className="text-right">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                isCompleted
                  ? "bg-green-950 text-green-100"
                  : isFailed
                  ? "bg-red-950 text-red-100"
                  : "bg-amber-950 text-amber-100"
              }`}
            >
              {isCompleted && <CheckCircle2 className="h-5 w-5" />}
              {isFailed && <AlertCircle className="h-5 w-5" />}
              {!isCompleted && !isFailed && <Clock className="h-5 w-5" />}
              {project.status === "processing" ? "Đang xử lý" : project.status}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      {progressData && (
        <div className="mb-8">
          <ProgressTracker
            steps={progressData.tasks.map((task: any, index: number) => ({
              id: `step-${index}`,
              name: `Task ${index + 1}`,
              status: task.status,
              error: task.error,
              startTime: task.startedAt ? new Date(task.startedAt) : undefined,
              endTime: task.completedAt ? new Date(task.completedAt) : undefined,
            }))}
            overallProgress={progressData.progress}
            isProcessing={progressData.status === "processing"}
          />
        </div>
      )}

      {/* Project Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-slate-900 border-slate-700 p-6">
          <h3 className="font-semibold text-white mb-4">Thông Tin Dự Án</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-slate-400">Chủ đề:</p>
              <p className="text-white">{project.topic}</p>
            </div>
            <div>
              <p className="text-slate-400">Trạng thái:</p>
              <p className="text-white capitalize">{project.status}</p>
            </div>
            <div>
              <p className="text-slate-400">Cấu hình:</p>
              <p className="text-white">
                {project.config
                  ? `${(project.config as any).sceneCount} cảnh, ${(project.config as any).videoDuration}s`
                  : "N/A"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900 border-slate-700 p-6">
          <h3 className="font-semibold text-white mb-4">Thống Kê</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Tổng tasks:</span>
              <span className="text-white font-semibold">{tasks?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hoàn thành:</span>
              <span className="text-green-400 font-semibold">
                {tasks?.filter((t) => t.status === "completed").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Lỗi:</span>
              <span className="text-red-400 font-semibold">
                {tasks?.filter((t) => t.status === "failed").length || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Auto Refresh Toggle */}
      <div className="flex items-center gap-4 mb-8">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded border-slate-600"
          />
          <span className="text-slate-300">Tự động cập nhật (mỗi 2 giây)</span>
        </label>

        <Button
          variant="outline"
          onClick={() => {
            refetch();
            refetchProgress();
          }}
          className="ml-auto"
        >
          Cập nhật ngay
        </Button>
      </div>

      {/* Tasks List */}
      {tasks && tasks.length > 0 && (
        <Card className="bg-slate-900 border-slate-700 p-6">
          <h3 className="font-semibold text-white mb-4">Chi Tiết Tasks</h3>
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg"
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    task.status === "completed"
                      ? "bg-green-900 text-green-200"
                      : task.status === "failed"
                      ? "bg-red-900 text-red-200"
                      : task.status === "processing"
                      ? "bg-amber-900 text-amber-200"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {task.status === "completed" ? "✓" : task.status === "failed" ? "✗" : "•"}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">Task {index + 1}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {task.startedAt && `Bắt đầu: ${new Date(task.startedAt).toLocaleTimeString("vi-VN")}`}
                  </p>
                  {task.error && (
                    <p className="text-xs text-red-400 mt-1">Lỗi: {task.error}</p>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    task.status === "completed"
                      ? "bg-green-900 text-green-200"
                      : task.status === "failed"
                      ? "bg-red-900 text-red-200"
                      : task.status === "processing"
                      ? "bg-amber-900 text-amber-200"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
