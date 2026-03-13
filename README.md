# The Faceless POV AI Machine 🎬✨

An elegant, automated AI-powered video generation platform that transforms ideas into professional videos in minutes. From script generation to YouTube upload, everything is fully automated.

## 🚀 Features

### Core Capabilities
- **🤖 AI Script Generation** - Automatic script creation from topics using OpenAI GPT-4
- **🎨 Image Generation** - Create stunning visuals with Flux and Qwen AI models via PiAPI
- **🎬 Video Creation** - Convert images to dynamic videos using Veo3 and Kling
- **🎙️ Voice Generation** - Natural-sounding narration with 8 voice options via ElevenLabs
- **🎞️ Video Rendering** - Professional video composition and effects with Creatomate
- **📤 Auto YouTube Upload** - Automatically publish to YouTube with optimized metadata
- **📊 Progress Tracking** - Real-time monitoring of your video generation pipeline
- **🔐 Secure API Management** - AES-256 encrypted API key storage

### Workflow Pipeline
```
Topic Input 
  ↓
Script Generation (OpenAI)
  ↓
Image Prompt Enhancement (OpenAI)
  ↓
Image Generation (PiAPI - Flux/Qwen)
  ↓
Video Clip Generation (PiAPI - Veo3/Kling)
  ↓
Voice Generation (ElevenLabs TTS)
  ↓
Video Rendering (Creatomate)
  ↓
YouTube Upload (YouTube Data API v3)
  ↓
Completion & Analytics
```

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - High-quality component library
- **tRPC** - Type-safe API calls
- **Wouter** - Lightweight routing

### Backend
- **Node.js + Express** - Server framework
- **tRPC** - RPC framework
- **MySQL/TiDB** - Database
- **Drizzle ORM** - Type-safe database access
- **Vitest** - Unit testing framework

### External APIs
- **OpenAI API** - Script and prompt generation
- **PiAPI** - Image and video generation
- **ElevenLabs API** - Text-to-speech
- **Creatomate API** - Video rendering
- **YouTube Data API v3** - Video uploads
- **Manus OAuth** - Authentication
- **AWS S3** - Asset storage

## 📦 Installation

## ⚡ Quick local setup (under 5 minutes)
```bash
git clone <your-repo-url>
cd faceless-pov-ai-machine
./scripts/setup-local.sh
npm run dev
```

Then open `http://localhost:3000` and verify health at `http://localhost:3000/api/health`.


### Prerequisites
- Node.js 22+
- pnpm package manager
- MySQL/TiDB database
- API keys for all external services

### Setup

1. **Clone and install dependencies**
```bash
cd faceless-pov-ai-machine
pnpm install
```

2. **Configure environment variables**
```bash
# Core
DATABASE_URL=mysql://...
JWT_SECRET=replace-with-secure-secret
VITE_APP_ID=local-dev-app

# OAuth (local fallback supported, but should be set explicitly for real auth)
OAUTH_SERVER_URL=http://localhost:3000
VITE_OAUTH_PORTAL_URL=http://localhost:3000

# Analytics (optional for local; if omitted, analytics script is disabled)
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=local-dev

# Providers
OPENAI_API_KEY=sk-...
PIAPI_API_KEY=pi_...
ELEVENLABS_API_KEY=sk_...
CREATOMATE_API_KEY=ct_...
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
```

3. **Setup database migrations**
```bash
# Applies current schema (including niche/topic/workflow durable queue tables)
pnpm db:push
```

4. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.


## 🧪 Chạy local không cần OAuth (Development Mode)

1. Clone repository
```bash
git clone https://github.com/duchungnguyenpccc-hash/my-manus-tool.git
cd my-manus-tool
```

2. Cài dependencies
```bash
npm install
```

3. Tạo file môi trường
```bash
cp .env.example .env
```

4. Build frontend vào `server/_core/public`
```bash
npm run build:client
```

5. Chạy local full stack (mock auth + backend + workflow worker)
```bash
npm run dev:local
```

Sau khi chạy thành công:
- App: `http://localhost:3000/dashboard`
- Health check: `http://localhost:3000/api/health`

> Ở chế độ development (`NODE_ENV=development`), OAuth sẽ được bỏ qua và hệ thống tự tạo mock session để có thể test toàn bộ UI/feature nhanh.

## 📚 API Documentation

### Authentication
All API endpoints require authentication via Manus OAuth. The session is automatically managed through cookies.

### tRPC Procedures

#### API Key Management
```typescript
// Add/update API key
trpc.apiKey.add.useMutation({
  provider: "openai",
  key: "sk-...",
})

// List user's API keys
trpc.apiKey.list.useQuery()

// Test API key
trpc.apiKey.test.useMutation({
  provider: "openai",
})

// Delete API key
trpc.apiKey.delete.useMutation({
  provider: "openai",
})
```

#### Script Generation
```typescript
// Generate video script
trpc.script.generate.useMutation({
  topic: "How to make coffee",
  sceneCount: 5,
  duration: 60,
})

// Enhance image prompts
trpc.script.enhancePrompts.useMutation({
  prompts: ["A coffee cup", "Pouring water"],
})

// Generate video metadata
trpc.script.generateMetadata.useMutation({
  topic: "How to make coffee",
  scriptLength: 500,
})
```

#### Image & Video Generation
```typescript
// Generate image from prompt
trpc.imageVideo.generateImage.useMutation({
  prompt: "A beautiful coffee cup",
  model: "flux", // or "qwen"
})

// Generate video from image
trpc.imageVideo.generateVideo.useMutation({
  imageUrl: "https://...",
  model: "veo3", // or "kling"
  duration: 5,
})

// Batch generate images
trpc.imageVideo.generateImageBatch.useMutation({
  prompts: ["Image 1", "Image 2"],
  model: "flux",
})
```

#### Audio Generation
```typescript
// Generate speech
trpc.audio.generateSpeech.useMutation({
  text: "Welcome to my video",
  voiceId: "alloy", // or other voice presets
})

// Generate multi-segment audio
trpc.audio.generateMultiSegmentSpeech.useMutation({
  segments: [
    { text: "Intro", voiceId: "alloy" },
    { text: "Main content", voiceId: "echo" },
  ],
})

// Get available voices
trpc.audio.getVoices.useQuery()
```

#### Video Rendering
```typescript
// Render final video
trpc.render.renderVideo.useMutation({
  videoClips: [{ url: "...", duration: 5 }],
  audioUrl: "https://...",
  textOverlays: [{ text: "Title", position: "center" }],
})

// Get render job status
trpc.render.getJobStatus.useQuery({
  jobId: "...",
})

// Cancel render job
trpc.render.cancelJob.useMutation({
  jobId: "...",
})
```

#### YouTube Upload
```typescript
// Upload video to YouTube
trpc.youtube.uploadVideo.useMutation({
  projectId: 1,
  videoUrl: "https://...",
  title: "My Awesome Video",
  description: "Check this out!",
  tags: ["ai", "video"],
  privacyStatus: "public",
})

// Get video info
trpc.youtube.getVideoInfo.useQuery({
  videoId: "dQw4w9WgXcQ",
})

// Update video metadata
trpc.youtube.updateMetadata.useMutation({
  videoId: "dQw4w9WgXcQ",
  title: "Updated Title",
  description: "Updated description",
})

// Get channel info
trpc.youtube.getChannelInfo.useQuery()

// List playlists
trpc.youtube.listPlaylists.useQuery()

// Create playlist
trpc.youtube.createPlaylist.useMutation({
  title: "My Videos",
  description: "Collection of AI videos",
})

// Add video to playlist
trpc.youtube.addToPlaylist.useMutation({
  videoId: "dQw4w9WgXcQ",
  playlistId: "PLxxxxxx",
})
```

#### Workflow Management
```typescript
// Create workflow tasks
trpc.workflow.createTasks.useMutation({
  projectId: 1,
  steps: [
    { taskType: "script", input: { topic: "..." } },
    { taskType: "image", input: { prompt: "..." } },
    { taskType: "video", input: { imageUrl: "..." } },
    { taskType: "audio", input: { text: "..." } },
    { taskType: "render", input: { clips: [...] } },
    { taskType: "upload", input: { videoUrl: "..." } },
  ],
})

// Get workflow progress
trpc.workflow.getProgress.useQuery({
  projectId: 1,
})

// Get all tasks
trpc.workflow.getTasks.useQuery({
  projectId: 1,
})

// Update task status
trpc.workflow.updateTaskStatus.useMutation({
  taskId: 1,
  status: "completed",
  output: { videoId: "..." },
})

// Retry failed task
trpc.workflow.retryTask.useMutation({
  taskId: 1,
})

// Skip task
trpc.workflow.skipTask.useMutation({
  taskId: 1,
  reason: "Not needed",
})

// Cancel all project tasks
trpc.workflow.cancelProject.useMutation({
  projectId: 1,
  reason: "User cancelled",
})

// Get workflow statistics
trpc.workflow.getStats.useQuery({
  projectId: 1,
})
```

## 🔐 Security

### API Key Encryption
All API keys are encrypted using AES-256-GCM before storage in the database. The encryption key is derived from the application's JWT secret.

### Authentication
- Manus OAuth for user authentication
- Session-based authentication with secure HTTP-only cookies
- Protected procedures require valid user context

### Data Protection
- All sensitive data is encrypted at rest
- API keys are never logged or exposed
- Secure S3 storage for generated assets

## 📊 Database Schema

### Users
- `id` - Primary key
- `openId` - Manus OAuth identifier
- `name` - User name
- `email` - User email
- `role` - User role (user/admin)
- `createdAt`, `updatedAt`, `lastSignedIn` - Timestamps

### API Keys
- `id` - Primary key
- `userId` - Foreign key to users
- `provider` - Provider name (openai, piapi, elevenlabs, creatomate, youtube)
- `encryptedKey` - Encrypted API key
- `isActive` - Active status
- `lastTestedAt` - Last test timestamp

### Video Projects
- `id` - Primary key
- `userId` - Foreign key to users
- `title` - Project title
- `topic` - Video topic
- `status` - Project status (draft, processing, completed, failed, archived)
- `config` - JSON configuration
- `youtubeVideoId`, `youtubeUrl` - YouTube upload info

### Workflow Tasks
- `id` - Primary key
- `projectId` - Foreign key to video_projects
- `taskType` - Task type (script, image, video, audio, render, upload)
- `status` - Task status (pending, processing, completed, failed, skipped)
- `input`, `output` - JSON data
- `error` - Error message
- `retryCount`, `maxRetries` - Retry tracking

### Generated Assets
- `id` - Primary key
- `taskId` - Foreign key to workflow_tasks
- `projectId` - Foreign key to video_projects
- `assetType` - Asset type (image, video, audio, script)
- `s3Key`, `s3Url` - S3 storage info
- `metadata` - JSON metadata

### YouTube Uploads
- `id` - Primary key
- `projectId` - Foreign key to video_projects
- `videoId` - YouTube video ID
- `title`, `description`, `tags` - Video metadata
- `status` - Upload status
- `youtubeUrl` - Video URL
- `viewCount`, `likeCount`, `commentCount` - Analytics

## 🧪 Testing

Run tests with:
```bash
pnpm test
```

Run tests in watch mode:
```bash
pnpm test:watch
```

Test coverage:
```bash
pnpm test:coverage
```

## 📝 Development

### Project Structure
```
faceless-pov-ai-machine/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── lib/           # Utilities
│   │   └── App.tsx        # Main app
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── services/          # Business logic
│   ├── routers/           # tRPC routers
│   ├── db.ts              # Database helpers
│   └── routers.ts         # Main router
├── drizzle/               # Database schema
├── shared/                # Shared types
└── storage/               # S3 helpers
```

### Adding New Features

1. **Update database schema** (`drizzle/schema.ts`)
2. **Generate migration** (`pnpm drizzle-kit generate`)
3. **Apply migration** (via webdev_execute_sql)
4. **Add database helpers** (`server/db.ts`)
5. **Create tRPC procedures** (`server/routers/`)
6. **Build UI components** (`client/src/pages/` or `client/src/components/`)
7. **Write tests** (`*.test.ts`)
8. **Update documentation**

## 🚀 Deployment

The application is ready for deployment on Manus platform. Use the Management UI to:
1. Configure custom domain
2. Set environment variables
3. Monitor analytics
4. Manage database

## 📞 Support

For issues and questions:
- Check the documentation
- Review test files for usage examples
- Check logs in `.manus-logs/` directory

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with:
- OpenAI for AI capabilities
- PiAPI for image/video generation
- ElevenLabs for voice synthesis
- Creatomate for video rendering
- YouTube for video hosting
- Manus for hosting and authentication

---

**Created with ❤️ by the Faceless POV AI Machine team**


### Local development notes
- App now validates URL-like env vars before use to avoid runtime errors such as `TypeError: Invalid URL`.
- If `VITE_ANALYTICS_ENDPOINT` is empty or invalid, analytics script injection is skipped in local mode.
- Frontend build output is configured to `server/_core/public` so backend can directly serve static build in production mode.

### Run locally
```bash
pnpm install
pnpm -s tsc --noEmit
npm run dev
```

### Build and serve with backend static files
```bash
pnpm -s vite build
NODE_ENV=production npm run dev
```


### Local setup script
Use the script below to bootstrap local development quickly:
```bash
./scripts/setup-local.sh
```

### Health check
```bash
curl http://localhost:3000/api/health
```


## 🏭 AI YouTube Automation Factory Modules

Hệ thống hiện chạy theo pipeline tự động:

Trend Research → Topic Queue → Project Creation → Script → Media → Render → Upload → Analytics Feedback

### Module mới
- `trendResearchEngineService`: phân tích trend + sinh topic ideas theo niche và đẩy vào queue.
- `scriptVersioningService`: lưu version script theo project để A/B test và audit.
- `metadataOptimizationService`: tối ưu title/description/tags trước khi upload YouTube.
- `analyticsFeedbackService`: lưu snapshots analytics (views, watch time, CTR, engagement) để đóng vòng lặp tối ưu nội dung.

### Lệnh chạy local nhanh
```bash
git clone https://github.com/duchungnguyenpccc-hash/my-manus-tool.git
cd my-manus-tool
npm install
cp .env.example .env
npm run dev
```

`npm run dev` sẽ build frontend vào `server/_core/public`, khởi chạy backend và workflow worker.


## 🏗️ Kiến trúc 4 lớp (Production Factory)

- **Control Plane**: Campaign Manager, Niche Manager, Topic AI Generator, Content Strategy Engine.
- **Execution Plane**: Durable queue + worker runtime + worker pool + retry/idempotency.
- **Data Plane**: MySQL/TiDB + Redis cache + S3 object storage.
- **Feedback Plane**: YouTube analytics feedback loop để tối ưu topic/niche.

Tài liệu chi tiết: `FACTORY_ARCHITECTURE_V2_VN.md`.


## 🔀 Hybrid Provider Architecture

Hệ thống hỗ trợ chạy **cloud** hoặc **local** cho từng stage mà không đổi pipeline:
- Script: OpenAI / Ollama
- Image: Midjourney-like cloud adapter / Stable Diffusion local
- Voice: ElevenLabs / Coqui TTS
- Render: Creatomate / FFmpeg local

Cấu hình provider được lưu trong bảng `provider_configurations` và được Provider Manager chọn động theo user settings.

### Local AI Setup Wizard
Vào trang **API Providers** để:
- kiểm tra local tools (Ollama, Stable Diffusion, FFmpeg, Whisper, Coqui TTS)
- copy lệnh cài đặt nhanh cho tool còn thiếu

### Môi trường local providers
```bash
OLLAMA_BASE_URL=http://127.0.0.1:11434
STABLE_DIFFUSION_URL=http://127.0.0.1:7860
COQUI_TTS_URL=http://127.0.0.1:5002
```


## 📈 YouTube Algorithm Simulator

Hệ thống có module mô phỏng thuật toán YouTube để chấm điểm viral trước sản xuất:
- Title CTR predictor (emotional triggers + curiosity gap + keyword strength)
- Retention predictor (hook + structure + novelty)
- Demand predictor (YouTube suggestions + Google trends)
- Competition predictor (video cạnh tranh + avg views)
- Viral score calculator (0-100)

### Production Gate
Chỉ topic có `viralScore >= VIRAL_SCORE_THRESHOLD` mới được phép vào production pipeline (`project.create`, `createFromNicheQueue`, `autoCreateFromQueue`).

Có thể cấu hình ngưỡng tại `.env`:
```bash
VIRAL_SCORE_THRESHOLD=65
```
