# The Faceless POV AI Machine - System Architecture

## Overview

A comprehensive AI-powered video generation and publishing system that automates the entire workflow from topic input to YouTube upload. The system integrates multiple AI APIs to create professional faceless POV videos with AI-generated images, voiceovers, and video composition.

## Core Workflow

```
Input Topic
    ↓
Generate Script & Image Prompts (OpenAI)
    ↓
Generate Images (PiAPI - Qwen/Flux)
    ↓
Convert Images to Video Clips (PiAPI - Veo3/Kling)
    ↓
Generate Voiceover (ElevenLabs TTS)
    ↓
Render & Compose Final Video (Creatomate)
    ↓
Upload to YouTube (YouTube Data API v3)
    ↓
Track & Display Results
```

## Technology Stack

### Frontend
- **Framework**: React 19 + Tailwind CSS 4
- **State Management**: TanStack React Query + tRPC
- **UI Components**: shadcn/ui
- **Design**: Elegant and perfect style with professional aesthetics

### Backend
- **Runtime**: Node.js 22 + Express 4
- **API Layer**: tRPC 11 (type-safe RPC)
- **Database**: MySQL/TiDB with Drizzle ORM
- **Authentication**: Manus OAuth

### External APIs

#### 1. OpenAI API
- **Purpose**: Generate video scripts and detailed image prompts
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Usage**: 
  - Create detailed video script from topic
  - Generate 5-10 detailed image prompts for each scene
  - Optimize prompts for image generation quality

#### 2. PiAPI (api.piapi.ai)
- **Purpose**: AI image generation and image-to-video conversion
- **Unified Endpoint**: `https://api.piapi.ai/api/v1/task`
- **Models**:
  - **Text-to-Image**: Qwen (txt2img) or Flux (flux1-schnell)
  - **Image-to-Video**: Veo3 (veo3-image-to-video) or Kling (kling-image-to-video)
- **Authentication**: Header `X-API-Key: {API_KEY}`
- **Flow**:
  1. Create task with `model` + `task_type` + `input`
  2. Poll task status via GET `/api/v1/task/{task_id}`
  3. Retrieve results when status = "completed"
  4. Store generated assets to S3

#### 3. ElevenLabs API
- **Purpose**: Text-to-speech voiceover generation
- **Endpoint**: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- **Authentication**: Header `xi-api-key: {API_KEY}`
- **Models**:
  - Eleven v3 (most expressive)
  - Eleven Multilingual v2 (29 languages)
  - Eleven Flash v2.5 (ultra-low latency)
- **Output Formats**: MP3, PCM, μ-law, A-law, Opus
- **Pricing**: $0.06-$0.12 per 1000 characters

#### 4. Creatomate API
- **Purpose**: Final video composition and rendering
- **Endpoint**: `https://api.creatomate.com/renders`
- **Authentication**: API Key in request body
- **Input**: RenderScript (JSON-based video composition)
- **Features**:
  - Combine images, audio, text, effects
  - Apply transitions and animations
  - Export to multiple formats (MP4, WebM, etc.)
- **Response**: Render job with status tracking

#### 5. YouTube Data API v3
- **Purpose**: Automatic video upload and metadata management
- **Endpoints**:
  - `POST /youtube/v3/videos` - Upload video
  - `PUT /youtube/v3/videos` - Update metadata
- **Authentication**: OAuth 2.0 with refresh tokens
- **Required Scopes**:
  - `https://www.googleapis.com/auth/youtube.upload`
  - `https://www.googleapis.com/auth/youtube`

## Database Schema

### Core Tables

#### `users`
- User authentication and profile management
- Fields: id, openId, name, email, role, createdAt, updatedAt

#### `api_keys` (Encrypted)
- Secure storage of external API credentials
- Fields: id, userId, provider (openai|piapi|elevenlabs|creatomate|youtube), encryptedKey, isActive, createdAt
- **Security**: AES-256 encryption at rest

#### `video_projects`
- Video generation projects/workflows
- Fields: id, userId, title, topic, status, config (JSON), createdAt, updatedAt

#### `workflow_tasks`
- Individual tasks in the video generation pipeline
- Fields: id, projectId, taskType (script|image|video|audio|render|upload), status, input (JSON), output (JSON), error, startedAt, completedAt

#### `generated_assets`
- Track generated images, videos, and audio files
- Fields: id, taskId, assetType (image|video|audio), s3Key, s3Url, metadata (JSON), createdAt

#### `youtube_uploads`
- Track YouTube upload history
- Fields: id, projectId, videoId, title, description, tags, uploadedAt, youtubeUrl, status

## API Integration Flow

### 1. Script Generation (OpenAI)
```
Input: { topic, sceneCount, duration }
↓
OpenAI API Call
↓
Output: { script, imagePrompts[], voiceScript }
↓
Store in workflow_tasks
```

### 2. Image Generation (PiAPI)
```
Input: { imagePrompts[] }
↓
For each prompt:
  - Create task (txt2img)
  - Poll status every 5 seconds
  - Download image when ready
  - Upload to S3
↓
Output: { imageUrls[] }
```

### 3. Video Clip Generation (PiAPI)
```
Input: { imageUrls[] }
↓
For each image:
  - Create task (image-to-video)
  - Poll status
  - Download video clip
  - Upload to S3
↓
Output: { videoClipUrls[] }
```

### 4. Voiceover Generation (ElevenLabs)
```
Input: { voiceScript, voiceId, model }
↓
ElevenLabs API Call
↓
Output: { audioUrl (MP3) }
↓
Upload to S3
```

### 5. Final Composition (Creatomate)
```
Input: { videoClips[], audioUrl, metadata }
↓
Build RenderScript (JSON)
↓
Submit to Creatomate API
↓
Poll render status
↓
Download final video
↓
Upload to S3
```

### 6. YouTube Upload (YouTube Data API v3)
```
Input: { videoFile, title, description, tags }
↓
Initialize resumable upload session
↓
Upload video chunks
↓
Set metadata and publish
↓
Store youtubeUrl in database
```

## Security Architecture

### API Key Management
- **Encryption**: AES-256 for stored API keys
- **Rotation**: Support for key rotation without downtime
- **Audit**: Log all API key access and usage
- **Isolation**: Keys isolated per user and provider

### OAuth Flow
- Manus OAuth for user authentication
- YouTube OAuth 2.0 for video upload authorization
- Refresh token management for long-lived sessions

### Data Protection
- All API calls over HTTPS
- S3 bucket with private access by default
- Presigned URLs for temporary file access
- Database encryption for sensitive fields

## File Storage (S3)

### Directory Structure
```
s3://bucket/
├── {userId}/
│   ├── projects/{projectId}/
│   │   ├── images/
│   │   │   └── {imageId}.png
│   │   ├── videos/
│   │   │   ├── clips/
│   │   │   │   └── {clipId}.mp4
│   │   │   └── final/
│   │   │       └── {videoId}.mp4
│   │   └── audio/
│   │       └── {audioId}.mp3
```

### Cleanup Strategy
- Auto-delete temporary files after 7 days
- Keep final videos for 90 days
- Archive completed projects to cold storage

## Queue & Job Processing

### Task Queue
- Use database-backed queue for reliability
- Process tasks sequentially per project
- Retry failed tasks with exponential backoff
- Webhook notifications for status updates

### Status Tracking
- Real-time status updates via WebSocket
- Progress percentage calculation
- Error handling and recovery
- Estimated time remaining

## Frontend Architecture

### Pages
- **Home**: Landing page with feature overview
- **Projects**: List of video projects with status
- **Create**: Input form for new video generation
- **Editor**: Configure workflow parameters
- **Dashboard**: Monitor active and completed videos
- **Settings**: Manage API keys and preferences

### Components
- **WorkflowForm**: Input topic and configuration
- **ApiKeyManager**: Secure API key management UI
- **ProgressTracker**: Real-time workflow progress
- **VideoPreview**: Display generated videos
- **YouTubeIntegration**: Upload and publish controls

## Performance Optimization

### Caching
- Cache generated scripts and prompts
- Cache image/video generation results
- Cache YouTube metadata

### Parallelization
- Generate multiple images in parallel
- Process video clips concurrently
- Batch API requests where possible

### Rate Limiting
- Respect API rate limits per provider
- Implement backoff strategies
- Queue management for fair access

## Monitoring & Analytics

### Metrics
- Video generation success rate
- Average generation time per step
- API cost per video
- YouTube upload success rate
- User engagement metrics

### Logging
- Structured logging for all API calls
- Error tracking and alerting
- Performance monitoring
- Audit logs for security

## Deployment Architecture

### Environment Variables
```
# OpenAI
OPENAI_API_KEY

# PiAPI
PIAPI_API_KEY

# ElevenLabs
ELEVENLABS_API_KEY

# Creatomate
CREATOMATE_API_KEY

# YouTube
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET

# Database
DATABASE_URL

# S3
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET
AWS_REGION

# Application
JWT_SECRET
VITE_APP_ID
OAUTH_SERVER_URL
```

## Error Handling & Resilience

### Retry Strategy
- Exponential backoff for transient failures
- Max 3 retries per task
- Circuit breaker for API failures

### Fallbacks
- Alternative image generation models
- Alternative TTS voices
- Manual intervention options

### Recovery
- Resume interrupted workflows
- Partial result handling
- Data consistency checks

## Future Enhancements

1. **Batch Processing**: Generate multiple videos in parallel
2. **Custom Templates**: User-defined video templates
3. **Advanced Analytics**: Detailed video performance metrics
4. **Multi-Platform**: Support TikTok, Instagram Reels, etc.
5. **AI Optimization**: Auto-tune prompts based on results
6. **Real-time Collaboration**: Multi-user project editing
