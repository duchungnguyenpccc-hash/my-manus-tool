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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Play, Pause, Clock } from "lucide-react";
import { toast } from "sonner";

interface Schedule {
  id: string;
  name: string;
  cronExpression: string;
  googleSheetUrl: string;
  isActive: boolean;
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  totalRuns: number;
  successfulRuns: number;
}

const CRON_PRESETS = [
  { label: "Hàng ngày (9 sáng)", value: "0 9 * * *" },
  { label: "Hàng ngày (6 tối)", value: "0 18 * * *" },
  { label: "Hàng tuần (Thứ 2)", value: "0 9 * * 1" },
  { label: "Hàng tuần (Thứ 5)", value: "0 9 * * 5" },
  { label: "Mỗi 6 giờ", value: "0 */6 * * *" },
  { label: "Mỗi 12 giờ", value: "0 */12 * * *" },
  { label: "Tùy chỉnh", value: "custom" },
];

export function ScheduleForm() {
  const [open, setOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("0 9 * * *");
  const [customCron, setCustomCron] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [scheduleName, setScheduleName] = useState("");
  const [autoPublish, setAutoPublish] = useState(true);
  const [maxConcurrent, setMaxConcurrent] = useState("1");

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduleName.trim()) {
      toast.error("Vui lòng nhập tên lịch trình");
      return;
    }

    if (!sheetUrl.trim()) {
      toast.error("Vui lòng nhập URL Google Sheets");
      return;
    }

    const cronExpression = selectedPreset === "custom" ? customCron : selectedPreset;

    if (!cronExpression.trim()) {
      toast.error("Vui lòng nhập cron expression");
      return;
    }

    setLoading(true);
    try {
      // TODO: Call tRPC to create schedule
      const newSchedule: Schedule = {
        id: Math.random().toString(36).substr(2, 9),
        name: scheduleName,
        cronExpression,
        googleSheetUrl: sheetUrl,
        isActive: true,
        createdAt: new Date(),
        totalRuns: 0,
        successfulRuns: 0,
      };

      setSchedules([...schedules, newSchedule]);
      toast.success("Lịch trình đã được tạo!");
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Lỗi khi tạo lịch trình");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setScheduleName("");
    setSheetUrl("");
    setSelectedPreset("0 9 * * *");
    setCustomCron("");
    setAutoPublish(true);
    setMaxConcurrent("1");
  };

  const handleToggleSchedule = async (scheduleId: string) => {
    try {
      // TODO: Call tRPC to toggle schedule
      setSchedules(
        schedules.map((s) =>
          s.id === scheduleId ? { ...s, isActive: !s.isActive } : s
        )
      );
      toast.success("Lịch trình đã được cập nhật");
    } catch (error) {
      toast.error("Lỗi khi cập nhật lịch trình");
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Bạn có chắc muốn xóa lịch trình này?")) return;

    try {
      // TODO: Call tRPC to delete schedule
      setSchedules(schedules.filter((s) => s.id !== scheduleId));
      toast.success("Lịch trình đã được xóa");
    } catch (error) {
      toast.error("Lỗi khi xóa lịch trình");
    }
  };

  const handleManualTrigger = async (scheduleId: string) => {
    try {
      // TODO: Call tRPC to manually trigger schedule
      toast.success("Lịch trình đã được kích hoạt!");
    } catch (error) {
      toast.error("Lỗi khi kích hoạt lịch trình");
    }
  };

  const getCronDescription = (cron: string): string => {
    const preset = CRON_PRESETS.find((p) => p.value === cron);
    if (preset) return preset.label;

    const parts = cron.split(" ");
    if (parts.length !== 5) return "Cron expression không hợp lệ";

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    if (hour === "*") return "Mỗi giờ";
    if (minute === "0" && hour !== "*") return `Mỗi ngày lúc ${hour}:00`;
    if (dayOfWeek !== "*") {
      const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      return `Mỗi ${days[parseInt(dayOfWeek)]} lúc ${hour}:${minute}`;
    }

    return cron;
  };

  return (
    <div className="space-y-6">
      {/* Add Schedule Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Lịch Trình Tự Động</h3>
          <p className="text-sm text-slate-400 mt-1">
            Tạo lịch trình để tự động tạo video từ Google Sheets
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 gap-2">
              <Plus size={18} />
              Thêm Lịch Trình
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo Lịch Trình Tự Động</DialogTitle>
              <DialogDescription>
                Cấu hình lịch trình để tự động tạo video từ Google Sheets
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSchedule} className="space-y-6">
              {/* Schedule Name */}
              <div className="space-y-2">
                <Label htmlFor="scheduleName">Tên Lịch Trình *</Label>
                <Input
                  id="scheduleName"
                  placeholder="Ví dụ: Video hàng ngày"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  disabled={loading}
                  className="bg-slate-900 border-slate-700"
                />
              </div>

              {/* Google Sheets URL */}
              <div className="space-y-2">
                <Label htmlFor="sheetUrl">Google Sheets URL *</Label>
                <Input
                  id="sheetUrl"
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  disabled={loading}
                  className="bg-slate-900 border-slate-700"
                />
                <p className="text-xs text-slate-400">
                  Spreadsheet phải có cột "topic" chứa chủ đề video
                </p>
              </div>

              {/* Cron Preset */}
              <div className="space-y-2">
                <Label htmlFor="cronPreset">Lịch Chạy *</Label>
                <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRON_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Cron */}
              {selectedPreset === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customCron">Cron Expression</Label>
                  <Input
                    id="customCron"
                    placeholder="0 9 * * * (format: minute hour day month weekday)"
                    value={customCron}
                    onChange={(e) => setCustomCron(e.target.value)}
                    disabled={loading}
                    className="bg-slate-900 border-slate-700 font-mono text-sm"
                  />
                  <p className="text-xs text-slate-400">
                    Ví dụ: "0 9 * * *" = 9 sáng hàng ngày
                  </p>
                </div>
              )}

              {/* Max Concurrent */}
              <div className="space-y-2">
                <Label htmlFor="maxConcurrent">Số Workflows Song Song</Label>
                <Input
                  id="maxConcurrent"
                  type="number"
                  min="1"
                  max="10"
                  value={maxConcurrent}
                  onChange={(e) => setMaxConcurrent(e.target.value)}
                  disabled={loading}
                  className="bg-slate-900 border-slate-700"
                />
                <p className="text-xs text-slate-400">
                  Số lượng video có thể tạo cùng lúc từ Google Sheets
                </p>
              </div>

              {/* Auto Publish */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoPublish"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  disabled={loading}
                  className="rounded border-slate-700"
                />
                <Label htmlFor="autoPublish" className="cursor-pointer">
                  Tự động đăng lên YouTube sau khi hoàn thành
                </Label>
              </div>

              {/* Info Card */}
              <Card className="bg-blue-900/20 border-blue-700/50 p-4">
                <p className="text-sm text-blue-200">
                  💡 <strong>Cách hoạt động:</strong> Lịch trình sẽ đọc các chủ đề từ Google Sheets,
                  tạo video tự động, và cập nhật trạng thái trong spreadsheet.
                </p>
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
                  {loading ? "Đang tạo..." : "Tạo Lịch Trình"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <Card className="bg-slate-900 border-slate-700 p-8 text-center">
          <Clock size={40} className="mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400">Chưa có lịch trình nào</p>
          <p className="text-sm text-slate-500 mt-2">
            Tạo lịch trình đầu tiên để tự động hóa quy trình tạo video
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <Card
              key={schedule.id}
              className="bg-slate-900 border-slate-700 p-4 hover:border-amber-500/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{schedule.name}</h4>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        schedule.isActive
                          ? "bg-green-900/50 text-green-200"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {schedule.isActive ? "Hoạt động" : "Tạm dừng"}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-slate-400">
                    <p>
                      <strong>Lịch:</strong> {getCronDescription(schedule.cronExpression)}
                    </p>
                    <p>
                      <strong>Google Sheets:</strong>{" "}
                      <a
                        href={schedule.googleSheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:underline"
                      >
                        Mở spreadsheet
                      </a>
                    </p>
                    <p>
                      <strong>Thống kê:</strong> {schedule.successfulRuns}/{schedule.totalRuns} lần
                      chạy thành công
                    </p>
                    {schedule.lastRun && (
                      <p>
                        <strong>Lần chạy cuối:</strong>{" "}
                        {new Date(schedule.lastRun).toLocaleString("vi-VN")}
                      </p>
                    )}
                    {schedule.nextRun && (
                      <p>
                        <strong>Lần chạy tiếp:</strong>{" "}
                        {new Date(schedule.nextRun).toLocaleString("vi-VN")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManualTrigger(schedule.id)}
                    title="Kích hoạt ngay"
                  >
                    <Play size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleSchedule(schedule.id)}
                    title={schedule.isActive ? "Tạm dừng" : "Bật lại"}
                  >
                    {schedule.isActive ? (
                      <Pause size={16} />
                    ) : (
                      <Play size={16} />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    title="Xóa lịch trình"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tips Card */}
      <Card className="bg-amber-900/20 border-amber-700/50 p-4">
        <p className="text-sm text-amber-200">
          <strong>💡 Mẹo:</strong> Chuẩn bị Google Sheets với cột "topic" chứa chủ đề video. Lịch
          trình sẽ tự động đọc các chủ đề, tạo video, và cập nhật kết quả (YouTube URL, trạng
          thái) vào spreadsheet.
        </p>
      </Card>
    </div>
  );
}
