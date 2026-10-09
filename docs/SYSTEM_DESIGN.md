# 🎬 Video Streaming Platform — Detailed System Design & Architecture

> This file contains the complete system design, video transcoding pipeline, 11-phase search algorithm, and API specifications.

[Table of Contents & full architecture preserved for reference]

---

## Architecture Overview

```
Client
  │
  ├── REST API (Express)  ◄──► Socket.IO (real-time upload/processing updates)
  │         │
  │         ├── PostgreSQL via Prisma ORM
  │         ├── Redis (ioredis) — caching + BullMQ queue
  │         └── MinIO S3 — file storage
  │
  └── Direct S3 upload (presigned URL, bypasses API server)
                │
                ▼
         BullMQ Worker  (video-processing queue, concurrency: 2)
                │
                └── FFmpeg — 360p + 720p HLS transcoding
```

The platform follows a multi-layer event-driven architecture. Heavy compute (transcoding) is offloaded to a background BullMQ worker while Redis handles caching and queue brokering. Raw uploads bypass the API server entirely via presigned S3 URLs, keeping the API lightweight.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js 18+ | Server-side JavaScript runtime |
| Framework | Express.js | HTTP routing and middleware |
| ORM | Prisma (PostgreSQL) | Type-safe database access |
| Queue | BullMQ + Redis | Background job scheduling |
| Object Storage | MinIO (AWS S3 SDK v3) | Video and media storage |
| Video Processing | FFmpeg via fluent-ffmpeg | HLS transcoding |
| Real-time | Socket.IO | WebSocket event streaming |
| Auth | JWT (jsonwebtoken) + bcrypt | Stateless auth, password hashing |
| File Upload | multer, multer-s3 | Multipart form handling |
| Search | PostgreSQL tsvector + pg_trgm | Full-text + fuzzy search |

---

## Video Processing Pipeline

### Upload Flow

```
1. POST /upload/init
   → Creates Video record (status: UPLOADING)
   → Returns { videoId, uploadUrl (presigned PUT), s3Key }

2. Client PUTs file directly to MinIO via presigned URL
   PUT /upload/progress/:videoId  (0–100, emits WS events)

3. POST /upload/complete { videoId }
   → S3 HeadObject verifies file exists
   → Video status → PROCESSING
   → BullMQ job enqueued { videoId, userId, s3Key }

4. Worker processes job
   a. status → PROCESSING, processingStage → DOWNLOAD
   b. Downloads raw file from S3_RAW_BUCKET to local /tmp/yt-worker/
   c. ffmpeg.screenshots({ timestamps: ["10%"], size: "1280x720" })
      → Upload to S3_PROCESSED_BUCKET as thumbnails/{videoId}.jpg
   d. ffprobe extracts duration → saved to DB
   e. processingStage → TRANSCODE
   f. FFmpeg encodes 360p + 720p HLS
   g. processingStage → UPLOAD
   h. All .ts + .m3u8 files → S3_PROCESSED_BUCKET/videos/{videoId}/
   i. status → READY, visibility → PUBLIC, masterPlaylist saved
   j. Cleanup all local temp files

5. On any error:
   status → PROCESSING_FAILED
   errorMessage + processingAttempts++ saved
   Retry via POST /:id/retry-processing (max 3)
```

### Video Status Machine

```
UPLOADING ──► PROCESSING ──► READY
                         └──► PROCESSING_FAILED  (max 3 retry attempts)
UPLOADING ──► FAILED     (cancelled or S3 verify failed)
```
