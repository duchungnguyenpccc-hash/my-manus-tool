# AI YouTube Automation Factory - Kiến trúc Production V2

## 1) Control Plane
- **Campaign Manager**: quản lý chiến dịch theo niche.
- **Niche Manager**: CRUD niche + topic queue.
- **Topic AI Generator**: sinh topic/title/hook và scoring bằng LLM.
- **Content Strategy Engine**: định nghĩa chiến lược nội dung theo KPI.

## 2) Execution Plane
- **Durable Workflow Queue**: bảng `workflow_jobs` + `workflowDispatchService`.
- **Worker Runtime**: `workflowWorker` + orchestrator cải tiến.
- **Worker Pool logic**:
  - research worker
  - script worker
  - media worker
  - render worker
  - upload worker
- **Reliability**:
  - retry/timeout qua `resilience.ts`
  - idempotent jobs qua `job_idempotency_keys`
  - rate-limit/pacing theo worker type (mở rộng theo provider)

## 3) Data Plane
- **MySQL/TiDB**: projects, niches, queue, workflow tasks, script versions, analytics feedback.
- **Redis Cache (optional)**: cache trend seeds, queue snapshots, idempotency hot path.
- **S3-compatible storage (optional)**: lưu generated assets/video artifacts.

## 4) Feedback Plane
- Thu metrics YouTube (`views`, `watch time`, `CTR`, `engagement`).
- Ghi về `analytics_feedback`.
- Dùng dữ liệu feedback để:
  - tăng/giảm priority niche
  - gợi ý chủ đề tương đồng với video thắng
  - tối ưu vòng lặp topic generation.

## Pipeline tổng thể
Trend research → Topic generation/scoring → Topic queue → Auto project creation → Script versions → Media pipeline → Render → Publish → Analytics feedback → Optimization.
