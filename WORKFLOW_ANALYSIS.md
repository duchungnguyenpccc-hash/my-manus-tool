# Workflow Analysis - The Faceless POV AI Machine

## INPUT: Video Topic
- Schedule Trigger (cron job hoặc manual trigger)
- Google Sheets integration (read topics từ spreadsheet)

## STEP 1: Generate Prompts
- **OpenAI Chat Moderation** - Validate input
- **Generate Titles** - Tạo tiêu đề video từ topic
- Output: Danh sách titles/prompts cho các bước tiếp theo

## STEP 2: Generate Images
Pipeline song song cho mỗi scene:
1. **Text-to-Image** (PIAPI - Qwen/Flux)
   - Input: Image prompts từ OpenAI
   - Output: Generated images
   
2. **Wait** - Chờ completion
   
3. **Get Image** - Download images từ PIAPI

## STEP 3: Generate Videos
Pipeline song song cho mỗi image:
1. **Image-to-Video** (PIAPI - Veo3/Kling)
   - Input: Generated images
   - Output: Video clips
   
2. **Wait1** - Chờ completion
   
3. **Get Video** - Download video clips từ PIAPI

## STEP 4: Generate Sounds
Pipeline tuần tự:
1. **Text-to-Sound** (ElevenLabs TTS)
   - Input: Script từ OpenAI
   - Output: Audio file
   
2. **Upload MP3** - Upload audio lên S3
   
3. **Update Access** - Update S3 access permissions

## STEP 5: Compose Final Video
1. **List Elements** - Liệt kê tất cả assets (images, videos, audio)
2. **Render Video** (Creatomate)
   - Input: Video clips + audio + text overlays
   - Output: Final rendered video
3. **Final Video Link** - Download final video

## OUTPUT: Final Video
- Merge all components
- Compose final video

## PUBLISHING AGENT
1. **Schedule Trigger** - Trigger upload schedule
2. **Get Video Link** - Lấy link video từ storage
3. **Get Video File** - Download video file
4. **YouTube** - Upload to YouTube
5. **Update sheet** - Update Google Sheets với YouTube link

---

## Key Differences from Current Implementation

### Current Issues:
1. ❌ Không có Google Sheets integration
2. ❌ Không có Schedule Trigger (cron job)
3. ❌ Workflow không song song (parallel processing)
4. ❌ Không có "Wait" steps cho async tasks
5. ❌ Không có proper asset management (List Elements)
6. ❌ Không có Publishing Agent tách biệt
7. ❌ Không có Google Sheets update sau upload
8. ❌ Workflow không có error handling/retry logic rõ ràng

### Required Improvements:
1. ✅ Implement parallel task execution
2. ✅ Add proper async/await with polling
3. ✅ Implement Google Sheets integration
4. ✅ Add schedule trigger system
5. ✅ Separate publishing agent logic
6. ✅ Implement asset listing and management
7. ✅ Add comprehensive error handling
8. ✅ Add retry logic cho failed tasks
