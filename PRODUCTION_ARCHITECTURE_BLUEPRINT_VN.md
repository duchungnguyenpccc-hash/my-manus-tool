# Production Architecture Blueprint (VN)

## 1) Vấn đề trong kiến trúc hiện tại

Dưới góc nhìn vận hành một business AI YouTube Automation đa ngách, hệ thống hiện tại đã có nhiều nền tảng tốt, nhưng chưa đạt mức production-grade ở các điểm sống còn:

### 1.1 Queue và scheduler chưa phân tán
- Workflow dispatch hiện dùng hàng đợi in-memory (`queue[]`) trong process Node.
- Khi process restart/deploy/crash, job đang chờ có thể mất.
- Không scale ngang an toàn khi chạy nhiều instance API.

### 1.2 Scheduler chưa durable
- `activeSchedules` là `Map` in-memory.
- Restart server làm mất lịch chạy đã đăng ký.
- Không có distributed lock nên dễ double-trigger nếu scale nhiều node.

### 1.3 Orchestrator còn “đơn khối” trong service
- Luồng chạy vẫn tập trung trong orchestrator service đơn, khó tách ownership theo stage khi hệ thống lớn.
- Thiếu state machine/event log chính thức cho pipeline.

### 1.4 Analytics feedback loop chưa “thật”
- Nhiều hàm analytics đang mock dữ liệu, chưa đủ để tối ưu nội dung theo hiệu suất thực tế.
- Chưa có vòng phản hồi tự động “analytics -> strategy update -> topic ranking”.

### 1.5 Multi-niche chưa được mô hình hóa đầy đủ trong data model
- Có module niche, nhưng chưa có thiết kế xuyên suốt cho: quota theo niche, topic queue theo niche, score theo niche, KPI theo niche, policy/risk theo niche.

### 1.6 Observability chưa hoàn chỉnh
- Có logging cơ bản, nhưng chưa có chuẩn tracing/metrics/SLO theo từng stage.
- Thiếu dashboard vận hành cho queue depth, retry ratio, fail reason taxonomy.

### 1.7 Mức tự động hóa frontend/backend còn “nửa chừng”
- Một số UI module còn TODO/local-state flow.
- Một số tác vụ publish/schedule nâng cao vẫn cần thao tác thủ công.

---

## 2) Kiến trúc đề xuất (production-grade, đa ngách)

Đề xuất kiến trúc 4 plane: **Control Plane, Execution Plane, Data Plane, Observability Plane**.

### 2.1 Control Plane (quản trị chiến lược)

#### (A) Niche Manager
- Quản lý tối thiểu 5 niche song song (ví dụ: Finance, AI Tools, Health, Productivity, Gaming).
- Mỗi niche có:
  - chiến lược nội dung,
  - lịch đăng,
  - ngân sách API,
  - ngưỡng rủi ro/policy,
  - KPI mục tiêu (CTR, retention, RPM, watch time).

#### (B) Channel Manager
- Mapping 1 hoặc nhiều channel cho từng niche.
- Quản lý thông số channel-level: timezone, cadence, upload window, playlist rule, metadata template.

#### (C) Content Strategy Engine
- Thu topic từ trend sources (YouTube/Google Trends/internal history).
- Chấm điểm topic theo:
  - demand score,
  - competition score,
  - monetization potential,
  - policy risk score,
  - novelty score.
- Đẩy topic vào **topic queue theo niche**.

#### (D) Policy & Risk Checker
- Rule engine trước publish:
  - rủi ro policy (misleading, harmful, reused content),
  - brand safety,
  - duplication similarity check.
- Tự động chặn hoặc chuyển “human review queue” nếu risk cao.

---

### 2.2 Execution Plane (thực thi pipeline)

#### (A) Distributed Job Queue
- Dùng queue bền vững: Redis Streams/BullMQ, RabbitMQ, SQS, hoặc Kafka + worker consumer groups.
- Tách queue theo miền:
  - `topic_planning_jobs`
  - `script_jobs`
  - `media_jobs`
  - `audio_jobs`
  - `render_jobs`
  - `publish_jobs`
  - `analytics_sync_jobs`

#### (B) Workflow Orchestrator (state machine)
- Orchestrator không làm nặng compute; chỉ điều phối state transitions:
  - `PENDING -> RUNNING -> RETRYING -> FAILED|COMPLETED`
- Mỗi step idempotent, có retry policy riêng, timeout riêng, DLQ riêng.

#### (C) Worker theo stage (horizontal scalable)
1. **Research Worker**
   - lấy topic từ queue theo niche, enrich dữ liệu trend.
2. **Script Worker**
   - tạo script + metadata + prompt pack.
3. **Media Worker**
   - tạo image/video clip song song theo scene.
4. **Audio Worker**
   - TTS + xử lý normalize/ducking metadata.
5. **Render Worker**
   - ghép asset, render final.
6. **Publish Worker**
   - upload YouTube, set metadata, playlist, schedule publish.

#### (D) Scheduling & Publishing Automation
- Scheduler dịch lịch đăng thành jobs (không chạy trực tiếp trong memory cron).
- Publish worker nhận job theo `publish_at` và channel timezone.

#### (E) Fault Tolerance
- Retry có backoff + jitter theo loại lỗi.
- Circuit breaker theo provider API.
- Dead-letter queue + auto-remediation playbook.

---

### 2.3 Data Plane

#### (A) Transactional DB (MySQL/Postgres)
- Lưu entities điều phối: niches/channels/topics/projects/workflows/tasks/policies.

#### (B) Object Storage
- S3-compatible lưu asset trung gian và final output.
- Versioning + lifecycle policy + checksum.

#### (C) Analytics Storage
- OLAP store (ClickHouse/BigQuery) cho time-series analytics.
- Fact tables: impressions, ctr, retention, rpm, watch_time theo niche/channel/topic/video.

#### (D) Caching
- Redis cache cho trend/query nóng và state ephemeral.

---

### 2.4 Observability Plane

#### (A) Logging
- Structured logging chuẩn JSON, có `trace_id`, `job_id`, `niche_id`, `project_id`, `channel_id`.

#### (B) Metrics
- Prometheus metrics:
  - queue depth,
  - job latency p50/p95,
  - retry count,
  - provider error rate,
  - publish success ratio.

#### (C) Tracing
- OpenTelemetry end-to-end trace qua API -> orchestrator -> workers -> external services.

#### (D) Failure Tracking
- Error taxonomy + incident dashboard + alerting (PagerDuty/Slack).

---

## 3) System Diagram (ASCII)

```text
                    ┌─────────────────────────────────────────┐
                    │              CONTROL PLANE              │
                    │ Niche Manager | Channel Manager         │
                    │ Strategy Engine | Policy/Risk Checker   │
                    └───────────────┬─────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────────┐
                    │        ORCHESTRATOR / API GATEWAY       │
                    │      (tRPC + Workflow State Machine)    │
                    └───────────────┬─────────────────────────┘
                                    │ enqueue jobs
                                    ▼
                    ┌─────────────────────────────────────────┐
                    │         DISTRIBUTED JOB QUEUE           │
                    │  topic | script | media | audio | ...   │
                    └───┬────────┬────────┬────────┬──────────┘
                        │        │        │        │
          ┌─────────────▼┐ ┌────▼────┐ ┌─▼──────┐ ┌─────────────▼┐
          │ResearchWorker│ │ScriptWkr│ │MediaWkr│ │Audio/RenderWkr│
          └──────┬───────┘ └────┬────┘ └──┬─────┘ └───────┬───────┘
                 │              │          │               │
                 └──────────────┴──────────┴───────────────┘
                                    │
                                    ▼
                           ┌────────────────┐
                           │ Publish Worker │
                           └───────┬────────┘
                                   │
                                   ▼
                         ┌──────────────────────┐
                         │ YouTube Data/Analytics│
                         └──────────────────────┘

                 ┌────────────────────────────────────────────┐
                 │                DATA PLANE                  │
                 │ SQL DB | Redis | Object Storage | OLAP DB  │
                 └────────────────────────────────────────────┘

                 ┌────────────────────────────────────────────┐
                 │             OBSERVABILITY PLANE            │
                 │ Logs | Metrics | Traces | Alerting         │
                 └────────────────────────────────────────────┘
```

---

## 4) Database Schema đề xuất

> Mục tiêu: hỗ trợ đa ngách, queue theo ngách, pipeline bền vững, feedback loop.

### 4.1 Core control tables
- `niches`
  - `id`, `name`, `status`, `description`, `target_audience`, `policy_profile`, `created_at`
- `channels`
  - `id`, `niche_id`, `youtube_channel_id`, `timezone`, `default_privacy`, `status`
- `niche_strategies`
  - `id`, `niche_id`, `strategy_version`, `pillars_json`, `kpi_targets_json`, `active`

### 4.2 Topic queue
- `topic_candidates`
  - `id`, `niche_id`, `title`, `source`, `trend_score`, `competition_score`, `novelty_score`, `risk_score`, `status`
- `topic_queue`
  - `id`, `niche_id`, `topic_candidate_id`, `priority`, `scheduled_for`, `state`, `locked_by`, `locked_until`

### 4.3 Project/workflow execution
- `projects`
  - `id`, `niche_id`, `channel_id`, `topic_id`, `status`, `config_json`, `publish_at`, `created_at`
- `workflow_runs`
  - `id`, `project_id`, `state`, `current_stage`, `started_at`, `ended_at`, `error_summary`
- `workflow_tasks`
  - `id`, `workflow_run_id`, `task_type`, `attempt`, `max_attempts`, `state`, `input_json`, `output_json`, `error_code`, `error_message`, `started_at`, `ended_at`

### 4.4 Assets
- `assets`
  - `id`, `project_id`, `asset_type`, `storage_key`, `storage_url`, `checksum`, `metadata_json`, `version`

### 4.5 Publishing & analytics
- `publish_jobs`
  - `id`, `project_id`, `channel_id`, `publish_at`, `state`, `youtube_video_id`, `youtube_url`
- `analytics_video_daily`
  - `id`, `video_id`, `date`, `views`, `impressions`, `ctr`, `watch_time`, `avg_view_duration`, `rpm`, `revenue`
- `analytics_topic_feedback`
  - `id`, `niche_id`, `topic_id`, `performance_score`, `retention_score`, `updated_at`

### 4.6 Risk/policy
- `policy_checks`
  - `id`, `project_id`, `rule_set_version`, `risk_level`, `violations_json`, `decision` (approve/block/review)

---

## 5) Folder structure đề xuất

```text
server/
  api/
    routers/
      nicheRouter.ts
      channelRouter.ts
      topicQueueRouter.ts
      projectRouter.ts
      workflowRouter.ts
      publishRouter.ts
      analyticsRouter.ts
      policyRouter.ts
  control-plane/
    niche-manager/
    channel-manager/
    strategy-engine/
    policy-risk-checker/
  execution-plane/
    orchestrator/
      workflowStateMachine.ts
      orchestrationService.ts
    queue/
      queueClient.ts
      queueTopics.ts
      dlqService.ts
    workers/
      researchWorker.ts
      scriptWorker.ts
      mediaWorker.ts
      audioWorker.ts
      renderWorker.ts
      publishWorker.ts
      analyticsSyncWorker.ts
  data-plane/
    db/
      schema/
      repositories/
      migrations/
    storage/
      objectStorageClient.ts
    cache/
      redisClient.ts
    analytics/
      olapClient.ts
  observability/
    logging/
      logger.ts
    metrics/
      metrics.ts
    tracing/
      tracing.ts
    alerts/
      alertService.ts
  shared/
    resilience/
    types/
    utils/
client/
  pages/
  components/
  modules/
    niches/
    channels/
    queue/
    analytics/
```

---

## 6) Required new modules

### 6.1 Control Plane modules
1. `nicheManagerService`
2. `channelManagerService`
3. `contentStrategyEngineService`
4. `policyRiskCheckerService`

### 6.2 Execution Plane modules
5. `distributedQueueService` (BullMQ/Rabbit/SQS adapter)
6. `workflowStateMachineService`
7. `researchWorker`
8. `scriptWorker`
9. `mediaWorker`
10. `audioWorker`
11. `renderWorker`
12. `publishWorker`
13. `analyticsSyncWorker`
14. `deadLetterQueueProcessor`

### 6.3 Data & Observability modules
15. `topicQueueRepository`
16. `analyticsIngestionService`
17. `metricsCollector`
18. `traceContextService`
19. `incidentAlertService`

### 6.4 Business automation modules
20. `nicheKpiAutoTuner` (tự điều chỉnh chiến lược theo KPI)
21. `topicReRanker` (xếp hạng lại topic queue theo feedback)
22. `publishWindowOptimizer` (tối ưu giờ đăng theo niche/channel)

---

## 7) Migration plan nâng cấp từ hệ thống hiện tại

## Giai đoạn 1: Ổn định nền tảng (1-2 sprint)
- Mục tiêu: không mất job, không mất schedule khi restart.
- Việc làm:
  - thay in-memory queue bằng distributed queue.
  - đưa schedule config vào DB + scheduler worker riêng.
  - thêm idempotency key cho render/upload.
- Kết quả business: giảm lỗi vận hành và can thiệp thủ công hàng ngày.

## Giai đoạn 2: Chuẩn hóa pipeline worker-based (2-3 sprint)
- Mục tiêu: scale theo stage độc lập.
- Việc làm:
  - tách orchestrator thành state machine.
  - tách workers cho script/media/audio/render/publish.
  - mỗi worker có retry/backoff/circuit-breaker riêng.
- KPI vận hành:
  - tăng throughput video/ngày,
  - giảm p95 latency end-to-end,
  - giảm manual retry.

## Giai đoạn 3: Đa ngách hoàn chỉnh + feedback loop (2 sprint)
- Mục tiêu: chạy ổn định >= 5 niche.
- Việc làm:
  - triển khai niche/channel/topic queue model đầy đủ.
  - analytics ingestion thật từ YouTube Analytics API.
  - topic re-ranker theo niche performance.
- KPI business:
  - tăng tỷ lệ video đạt target CTR/retention theo niche,
  - giảm thời gian chọn topic thủ công.

## Giai đoạn 4: Governance + observability production (1-2 sprint)
- Mục tiêu: an toàn policy và dễ vận hành ở quy mô lớn.
- Việc làm:
  - policy risk checker trước publish.
  - dashboard SLO + alerting + failure taxonomy.
  - runbook tự động cho lỗi phổ biến (rate-limit, timeout, quota).
- KPI vận hành:
  - giảm tỷ lệ failed publish,
  - giảm MTTR,
  - tăng reliability SLA.

---

## Kết luận cho chủ business AI YouTube Automation

Để vận hành đa ngách bền vững với ít nhân sự, hệ thống cần chuyển từ kiến trúc monolith + in-memory orchestration sang mô hình **distributed queue + worker pipeline + control plane đa ngách + analytics feedback loop thật**.

Kiến trúc đề xuất ở trên giúp bạn:
- vận hành đồng thời nhiều niche/channel,
- tự động hóa sâu từ topic đến publish,
- kiểm soát rủi ro policy tốt hơn,
- và tăng throughput mà vẫn giữ độ ổn định production.
