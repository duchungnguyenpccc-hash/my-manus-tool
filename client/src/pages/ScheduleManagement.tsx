import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { ScheduleForm } from "@/components/ScheduleForm";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export default function ScheduleManagement() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">Quản Lý Lịch Trình</h1>
          <p className="text-sm text-slate-400">
            Tự động hóa quy trình tạo video với Google Sheets
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-700 p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 mt-1" />
              <div>
                <h3 className="font-semibold text-white">Lịch Trình Hoạt Động</h3>
                <p className="text-2xl font-bold text-amber-400 mt-1">0</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-700 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-1" />
              <div>
                <h3 className="font-semibold text-white">Video Tạo Thành Công</h3>
                <p className="text-2xl font-bold text-green-400 mt-1">0</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-700 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-1" />
              <div>
                <h3 className="font-semibold text-white">Lỗi</h3>
                <p className="text-2xl font-bold text-red-400 mt-1">0</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Schedule Form */}
        <Card className="bg-slate-900 border-slate-700 p-6">
          <ScheduleForm />
        </Card>

        {/* Documentation */}
        <div className="mt-12 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Hướng Dẫn Sử Dụng</h2>

            <div className="space-y-4">
              {/* Step 1 */}
              <Card className="bg-slate-900 border-slate-700 p-4">
                <h3 className="font-semibold text-white mb-2">
                  Bước 1: Chuẩn Bị Google Sheets
                </h3>
                <p className="text-slate-400 text-sm mb-3">
                  Tạo một Google Sheets với cột "topic" chứa chủ đề video:
                </p>
                <div className="bg-slate-800 p-3 rounded text-sm font-mono text-slate-300 overflow-x-auto">
                  <pre>{`| topic                          | status    | youtube_url |
|--------------------------------|-----------|-------------|
| Cách nấu mì tôm ngon           | pending   |             |
| Top 5 điều thú vị về AI        | completed | https://... |
| Hướng dẫn học lập trình Python | pending   |             |`}</pre>
                </div>
              </Card>

              {/* Step 2 */}
              <Card className="bg-slate-900 border-slate-700 p-4">
                <h3 className="font-semibold text-white mb-2">
                  Bước 2: Tạo Lịch Trình
                </h3>
                <ul className="text-slate-400 text-sm space-y-2">
                  <li>• Click "Thêm Lịch Trình"</li>
                  <li>• Nhập tên lịch trình (ví dụ: "Video hàng ngày")</li>
                  <li>• Dán URL của Google Sheets</li>
                  <li>• Chọn lịch chạy (hàng ngày, hàng tuần, ...)</li>
                  <li>• Bật "Tự động đăng lên YouTube" nếu muốn</li>
                  <li>• Click "Tạo Lịch Trình"</li>
                </ul>
              </Card>

              {/* Step 3 */}
              <Card className="bg-slate-900 border-slate-700 p-4">
                <h3 className="font-semibold text-white mb-2">
                  Bước 3: Theo Dõi Tiến Trình
                </h3>
                <ul className="text-slate-400 text-sm space-y-2">
                  <li>• Lịch trình sẽ tự động chạy theo thời gian đã đặt</li>
                  <li>• Bạn có thể click "Play" để kích hoạt ngay</li>
                  <li>• Trạng thái sẽ cập nhật tự động trong Google Sheets</li>
                  <li>• YouTube URL sẽ được thêm vào sau khi upload thành công</li>
                </ul>
              </Card>

              {/* Cron Examples */}
              <Card className="bg-slate-900 border-slate-700 p-4">
                <h3 className="font-semibold text-white mb-2">
                  Ví Dụ Cron Expression
                </h3>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex justify-between">
                    <span>Hàng ngày lúc 9 sáng:</span>
                    <code className="bg-slate-800 px-2 py-1 rounded font-mono">0 9 * * *</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Hàng tuần (Thứ 2) lúc 9 sáng:</span>
                    <code className="bg-slate-800 px-2 py-1 rounded font-mono">0 9 * * 1</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Mỗi 6 giờ:</span>
                    <code className="bg-slate-800 px-2 py-1 rounded font-mono">0 */6 * * *</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Mỗi 30 phút:</span>
                    <code className="bg-slate-800 px-2 py-1 rounded font-mono">*/30 * * * *</code>
                  </div>
                </div>
              </Card>

              {/* Tips */}
              <Card className="bg-blue-900/20 border-blue-700/50 p-4">
                <h3 className="font-semibold text-blue-200 mb-2">💡 Mẹo Hữu Ích</h3>
                <ul className="text-blue-200 text-sm space-y-2">
                  <li>
                    • Hãy đảm bảo Google Sheets được chia sẻ công khai hoặc cấp quyền truy cập
                  </li>
                  <li>• Cột "topic" là bắt buộc, các cột khác là tùy chọn</li>
                  <li>• Bạn có thể có nhiều lịch trình chạy cùng lúc</li>
                  <li>• Sử dụng "Số Workflows Song Song" để kiểm soát tải</li>
                  <li>• Kiểm tra Google Sheets thường xuyên để xem kết quả</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
