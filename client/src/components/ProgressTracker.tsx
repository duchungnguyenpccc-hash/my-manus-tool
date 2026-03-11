import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";

export type WorkflowStepStatus = "pending" | "processing" | "completed" | "failed";

export interface WorkflowStep {
  id: string;
  name: string;
  status: WorkflowStepStatus;
  progress?: number;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

interface ProgressTrackerProps {
  steps: WorkflowStep[];
  overallProgress: number;
  estimatedTimeRemaining?: number;
  isProcessing: boolean;
}

export function ProgressTracker({
  steps,
  overallProgress,
  estimatedTimeRemaining,
  isProcessing,
}: ProgressTrackerProps) {
  const getStepIcon = (status: WorkflowStepStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={20} className="text-green-500" />;
      case "processing":
        return <Loader2 size={20} className="text-amber-500 animate-spin" />;
      case "failed":
        return <AlertCircle size={20} className="text-red-500" />;
      default:
        return <Clock size={20} className="text-slate-400" />;
    }
  };

  const getStepColor = (status: WorkflowStepStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-900/20 border-green-700/50";
      case "processing":
        return "bg-amber-900/20 border-amber-700/50";
      case "failed":
        return "bg-red-900/20 border-red-700/50";
      default:
        return "bg-slate-800 border-slate-700";
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="bg-slate-900 border-slate-700 p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tiến Độ Xử Lý</h3>
            <span className="text-2xl font-bold text-amber-500">{overallProgress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* Status Info */}
          <div className="flex justify-between text-sm text-slate-400">
            <span>
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Đang xử lý...
                </span>
              ) : overallProgress === 100 ? (
                <span className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 size={14} />
                  Hoàn thành!
                </span>
              ) : (
                "Chờ..."
              )}
            </span>
            {estimatedTimeRemaining && isProcessing && (
              <span>Còn lại: {formatTime(estimatedTimeRemaining)}</span>
            )}
          </div>
        </div>
      </Card>

      {/* Steps List */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-slate-300">Chi Tiết Các Bước:</h4>

        {steps.map((step, index) => (
          <Card
            key={step.id}
            className={`border p-4 transition-all ${getStepColor(step.status)}`}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">{getStepIcon(step.status)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {index + 1}. {step.name}
                  </span>
                  {step.status === "processing" && step.progress !== undefined && (
                    <span className="text-xs text-amber-400">{step.progress}%</span>
                  )}
                </div>

                {/* Progress Bar for Processing Steps */}
                {step.status === "processing" && step.progress !== undefined && (
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                )}

                {/* Error Message */}
                {step.status === "failed" && step.error && (
                  <p className="text-xs text-red-300 mt-2">{step.error}</p>
                )}

                {/* Timing Info */}
                {step.startTime && (
                  <p className="text-xs text-slate-500 mt-2">
                    Bắt đầu: {new Date(step.startTime).toLocaleTimeString("vi-VN")}
                    {step.endTime && (
                      <>
                        {" "}
                        | Kết thúc: {new Date(step.endTime).toLocaleTimeString("vi-VN")}
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    step.status === "completed"
                      ? "bg-green-900/50 text-green-200"
                      : step.status === "processing"
                        ? "bg-amber-900/50 text-amber-200"
                        : step.status === "failed"
                          ? "bg-red-900/50 text-red-200"
                          : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {step.status === "completed"
                    ? "Hoàn thành"
                    : step.status === "processing"
                      ? "Đang xử lý"
                      : step.status === "failed"
                        ? "Lỗi"
                        : "Chờ"}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tips */}
      <Card className="bg-blue-900/20 border-blue-700/50 p-4">
        <p className="text-sm text-blue-200">
          💡 <strong>Mẹo:</strong> Quá trình tạo video có thể mất từ 5-30 phút tùy thuộc vào độ
          dài video và cấu hình. Bạn có thể đóng trang này, tiến trình vẫn tiếp tục chạy ở phía
          máy chủ.
        </p>
      </Card>
    </div>
  );
}
