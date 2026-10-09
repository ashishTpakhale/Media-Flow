# 📡 YouTube Clone — API Documentation

> Complete REST API + WebSocket reference for the YouTube Clone Backend.  
> Base URL: `http://localhost:8000` &nbsp;|&nbsp; API Base: `http://localhost:8000/api`

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health](#health)
  - [Auth](#auth)
  - [Video Upload & Management](#video-upload--management)
  - [Video Interaction](#video-interaction)
  - [Comments](#comments)
  - [Feed & History](#feed--history)
  - [Search](#search)
  - [Subscriptions](#subscriptions)
  - [Recommendations](#recommendations)
  - [Analytics](#analytics)
  - [Thumbnails](#thumbnails)
- [WebSocket Events](#websocket-events)
- [Video Processing Workflow](#video-processing-workflow)
- [Search Algorithm](#search-algorithm)
- [View Counting Logic](#view-counting-logic)
- [Error Handling](#error-handling)
- [Quick Start](#quick-start)

---

## Overview

A **YouTube-style video platform backend** built with Node.js. Handles user authentication, video uploading and processing (HLS transcoding via FFmpeg), real-time updates via WebSocket, advanced search with personalization, and a multi-phase recommendation engine.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Database | PostgreSQL via Prisma ORM |
| Cache / Queue | Redis via BullMQ + ioredis |
| Storage | AWS S3 (Raw, Processed, User Media) |
| Video Processing | FFmpeg — HLS Transcoding |
| Real-time | Socket.IO |
| Auth | JWT (jsonwebtoken) + bcrypt |

---

## Environment Variables

```env
# Server
PORT=8000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/youtube_clone

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# S3 — Raw Videos
S3_RAW_BUCKET=yt-raw-bucket
S3_ENDPOINT=https://s3.amazonaws.com

# S3 — Processed Videos (HLS)
S3_PROCESSED_BUCKET=yt-processed-bucket

# S3 — User Media (Avatars / Banners)
S3_USER_MEDIA_BUCKET=yt-user-media

# AWS Credentials
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

---

## Authentication

Most endpoints require a **Bearer Token** in the `Authorization` header.

```http
Authorization: Bearer <JWT_TOKEN>
```

**Token payload:**
```json
{
  "id": "user-uuid",
  "exp": 1234567890
}
```

Tokens expire in **1 hour**. Passwords are hashed with **bcrypt (10 rounds)**.

---

## Endpoints

### Health

#### `GET /health`

> No auth required.

**Response `200`**
```json
{ "status": "ok" }
```

---

### Auth

#### `POST /api/register`

Register a new user account.

**Request body**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "password123",
  "displayName": "John Doe"
}
```

**Response `201`**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "isVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**

| Code | Message |
|---|---|
| `400` | `Email, username and password are required` |
| `400` | `Password must be at least 8 characters long` |
| `409` | `Email or username already exists` |

---

#### `POST /api/login`

**Request body**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response `200`**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatarUrl": "https://s3..."
  }
}
```

**Error `401`** — `Invalid credentials`

---

#### `GET /api/aboutme` 🔒

Get the currently authenticated user's profile.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "bio": "Content creator",
    "avatarUrl": "https://s3...",
    "channelBanner": "https://s3...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### `PUT /api/update` 🔒

Update profile details. Accepts `multipart/form-data`.

| Field | Type | Description |
|---|---|---|
| `displayName` | string | Display name |
| `bio` | string | Channel bio |
| `avatar` | file | Avatar image |
| `banner` | file | Channel banner image |

**Response `200`**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "uuid",
    "displayName": "Updated Name",
    "bio": "New bio",
    "avatarUrl": "https://s3...",
    "channelBanner": "https://s3...",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### `DELETE /api/delete` 🔒

Permanently delete the authenticated user's account.

**Response `200`** — `{ "message": "User deleted successfully" }`

---

#### `GET /api/my-videos` 🔒

Get all videos uploaded by the authenticated user (all statuses).

**Response `200`**
```json
{
  "success": true,
  "count": 5,
  "videos": [
    {
      "id": "video-uuid",
      "title": "My Video",
      "status": "READY",
      "views": 1000,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### `GET /api/channel/:channelId`

Get public channel info and its published videos.

**Response `200`**
```json
{
  "success": true,
  "channel": {
    "id": "uuid",
    "name": "Channel Name",
    "avatar": "https://s3...",
    "banner": "https://s3...",
    "bio": "Bio",
    "joinedAt": "2024-01-01T00:00:00.000Z",
    "subscriberCount": 1500,
    "totalVideos": 25,
    "totalViews": 50000
  },
  "videos": [
    {
      "id": "video-uuid",
      "title": "Video Title",
      "thumbnailUrl": "https://s3...",
      "views": 1000,
      "visibility": "PUBLIC",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "duration": 120
    }
  ]
}
```

---

### Video Upload & Management

#### `POST /api/videos/upload/init` 🔒

Initialize an upload. Creates a DB record and returns a presigned S3 URL for direct upload.

> Thumbnail can be sent as a file field (`thumbnail`), base64 string (`thumbnailBase64`), or external URL (`thumbnailUrl`).

**Request body**
```json
{
  "title": "My Video",
  "description": "Description",
  "fileSize": 104857600,
  "mimeType": "video/mp4",
  "originalName": "video.mp4",
  "thumbnailUrl": "https://example.com/thumb.jpg"
}
```

**Response `200`**
```json
{
  "videoId": "uuid",
  "uploadUrl": "https://s3.amazonaws.com/bucket/raw/uuid/video.mp4?X-Amz-...",
  "s3Key": "raw/uuid/video.mp4"
}
```

**Errors**

| Code | Message |
|---|---|
| `400` | `Missing required fields` — `title`, `fileSize`, `mimeType` |
| `400` | `File too large` — max 5 GB |
| `401` | `Unauthorized - No user found` |

---

#### `POST /api/videos/upload/complete` 🔒

Notify the server that the S3 upload finished. Triggers the processing worker.

**Request body**
```json
{ "videoId": "video-uuid" }
```

**Response `200`**
```json
{
  "message": "Video processing started",
  "videoId": "video-uuid",
  "status": "PROCESSING"
}
```

**Error `400`** — `Upload failed or file missing`

---

#### `PUT /api/videos/upload/progress/:videoId` 🔒

Report upload progress (0–100). Emits a `video:update` WebSocket event to the user's room.

**Request body**
```json
{ "progress": 75 }
```

**Response `200`** — `{ "success": true }`

---

#### `GET /api/videos/:id`

Get public video details. Video must have `READY + PUBLIC` status.

**Response `200`**
```json
{
  "id": "video-uuid",
  "title": "My Video",
  "description": "Desc",
  "thumbnailUrl": "https://s3...",
  "duration": 120,
  "views": 1000,
  "status": "READY",
  "visibility": "PUBLIC",
  "user": {
    "id": "user-uuid",
    "username": "johndoe",
    "avatarUrl": "https://s3..."
  }
}
```

**Error `403`** — `Video is private`

---

#### `GET /api/videos/stream/:id`

Get the HLS master playlist URL for streaming.

**Response `200`**
```json
{
  "streamUrl": "http://localhost:9000/processed-bucket/videos/uuid/master.m3u8"
}
```

**Error `404`** — `Video not ready`

---

#### `PUT /api/videos/:id` 🔒

Update video metadata.

**Request body**
```json
{
  "title": "Updated Title",
  "description": "Updated desc",
  "visibility": "PUBLIC",
  "scheduledAt": "2024-01-01T12:00:00.000Z"
}
```

**Response `200`** — `{ "success": true, "message": "Video updated successfully", "video": { ... } }`

---

#### `DELETE /api/videos/:id` 🔒

Delete a video and all associated S3 files.

**Response `200`** — `{ "message": "Video deleted successfully" }`

---

#### `POST /api/videos/:id/cancel` 🔒

Cancel a video that is currently `UPLOADING` or `PROCESSING`.

**Response `200`** — `{ "message": "Video cancelled" }`  
**Error `400`** — `Cannot cancel video now`

---

#### `POST /api/videos/:id/retry-processing` 🔒

Retry a failed processing job. Maximum **3 attempts**.

**Response `200`** — `{ "message": "Processing retry started", "videoId": "video-uuid" }`  
**Error `409`** — `{ "message": "Retry limit exceeded", "attempts": 3, "maxRetries": 3 }`

---

### Video Interaction

#### `POST /api/videos/:id/view` 🔒

Record a watch event. Increments view count if the session qualifies.

```
Qualifies if: watchDuration >= 20s  OR  watchDuration >= 30% of video duration
```

**Request body**
```json
{ "watchDuration": 45 }
```

**Response `200`**
```json
{
  "message": "View counted",
  "viewCounted": true,
  "viewCount": 1001
}
```

---

#### `GET /api/videos/:id/likes`

Auth optional — `likedByUser` only returned when authenticated.

**Response `200`**
```json
{
  "success": true,
  "totalLikes": 150,
  "likedByUser": true
}
```

---

#### `POST /api/videos/like/:videoId` 🔒

Like a video. Error if already liked.

**Response `200`** — `{ "message": "Video liked" }`

---

#### `DELETE /api/videos/like/:videoId` 🔒

Unlike a video.

**Response `200`** — `{ "message": "Video unliked" }`

---

#### `GET /api/videos/likedvideos` 🔒

Get all videos liked by the authenticated user.

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "like-uuid",
      "video": {
        "id": "video-uuid",
        "title": "Title",
        "thumbnailUrl": "https://s3...",
        "user": { "..." : "..." }
      }
    }
  ]
}
```

---

### Comments

#### `GET /api/videos/:id/comments`

Auth optional. Returns `isLikedByUser` only when authenticated.

**Query params**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page |
| `sort` | string | `newest` | `newest` or `top` |

**Response `200`**
```json
{
  "comments": [
    {
      "id": "comment-uuid",
      "content": "Great video!",
      "likes": 10,
      "isLikedByUser": false,
      "isPinned": false,
      "isEdited": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "user": { "..." : "..." },
      "_count": { "replies": 2 }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasMore": true
  }
}
```

---

#### `POST /api/videos/:id/comments` 🔒

Create a top-level comment or a reply. Pass `parentId` for replies.

**Request body**
```json
{
  "content": "Great video!",
  "parentId": "comment-uuid"
}
```

**Response `201`**
```json
{
  "id": "comment-uuid",
  "content": "Great video!",
  "likes": 0,
  "isLikedByUser": false,
  "user": { "..." : "..." },
  "replies": []
}
```

**Errors** — `Comment content is required` · `Comment too long (max 2000 chars)`

---

#### `PUT /api/videos/:id/comments/:commentId` 🔒

Edit your own comment.

**Request body** — `{ "content": "Updated comment" }`

**Response `200`** — Returns updated comment with `isEdited: true`

---

#### `DELETE /api/videos/:id/comments/:commentId` 🔒

Delete a comment. Video owners can delete any comment on their video.

**Response `200`** — `{ "success": true }`

---

#### `GET /api/videos/:id/comments/:commentId/replies`

Get paginated replies for a comment. Auth optional.

**Response `200`** — `{ "replies": [...], "pagination": { ... } }`

---

#### `POST /api/videos/:id/comments/:commentId/like` 🔒

Toggle a like on a comment (like / unlike).

**Response `200`**
```json
{ "liked": true, "likes": 11 }
```

---

### Feed & History

#### `GET /api/feed/home` 🔒

Cursor-paginated chronological feed (`createdAt DESC`). Only `READY + PUBLIC` videos.

**Query params** — `cursor` (ISO timestamp from previous response)

**Response `200`**
```json
{
  "videos": [ "..." ],
  "nextCursor": "2024-01-01T00:00:00.000Z"
}
```

---

#### `GET /api/feed/trending` 🔒

Score-based trending feed. Scores computed over the last **24 hours**.

```
trendingScore = recentViews × 3 + recentCompletions × 5 − ageInHours × 0.5
```

**Response `200`**
```json
{
  "videos": [
    {
      "id": "video-uuid",
      "title": "Trending Video",
      "trendingScore": 95.5,
      "user": { "..." : "..." }
    }
  ]
}
```

---

#### `GET /api/feed/hybrid` 🔒

Hybrid ranked feed combining trending, personalized, and collaborative signals.

```
finalScore = trendingScore × 0.40
           + personalScore × 0.40
           + collabScore   × 0.20
```

**Response `200`**
```json
{
  "videos": [
    {
      "id": "video-uuid",
      "title": "Personalized Video",
      "trendingScore": 1.0,
      "personalScore": 1.0,
      "collabScore": 1.0,
      "finalScore": 1.0,
      "user": { "..." : "..." }
    }
  ]
}
```

---

#### `GET /api/feed/history` 🔒

Paginated watch history for the authenticated user.

**Query params** — `page`, `limit`

**Response `200`**
```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": "history-uuid",
      "watchDuration": 45,
      "completed": false,
      "watchedAt": "2024-01-01T00:00:00.000Z",
      "video": { "..." : "..." }
    }
  ]
}
```

---

#### `DELETE /api/feed/history/:videoId` 🔒

Remove a single video from watch history.

**Response `200`** — `{ "message": "History item deleted" }`

---

#### `DELETE /api/feed/history` 🔒

Clear the entire watch history for the authenticated user.

**Response `200`** — `{ "message": "All history cleared" }`

---

### Search

#### `GET /api/search/`

Auth optional — authenticated users get personalized ranking multipliers applied.

**Query params**

| Param | Type | Default | Description |
|---|---|---|---|
| `q` | string | — | Search query (**required**) |
| `type` | string | `all` | `video`, `channel`, or `all` |
| `limit` | number | `20` | Max results (max `50`) |
| `cursor` | string | — | Base64 pagination cursor |

**Response `200`**
```json
{
  "query": "search term",
  "intent": { "video": 0.5, "channel": 0.3 },
  "items": [
    {
      "type": "video",
      "id": "video-uuid",
      "title": "Video Title",
      "channel": { "id": "user-uuid", "username": "johndoe", "verified": true },
      "score": 0.85
    },
    {
      "type": "channel",
      "id": "user-uuid",
      "username": "johndoe",
      "subscriberCount": 1500,
      "score": 0.75
    }
  ],
  "nextCursor": "eyJ2aWRlb0luZGV4IjoxMCwiY2hhbm5lbEluZGV4IjozfQ==",
  "stats": {
    "total": 13,
    "videos": 10,
    "channels": 3,
    "hasMore": true
  }
}
```

**Error `400`** — `{ "error": "Query required" }`

---

### Subscriptions

#### `POST /api/subscribe/:channelId` 🔒

Subscribe to a channel. Pass `videoId` in the body to attribute the subscription to a specific video (used in analytics).

**Request body** *(optional)*
```json
{ "videoId": "video-uuid" }
```

**Response `200`** — `{ "message": "Subscribed successfully" }`  
**Error `400`** — `Cannot subscribe to yourself`

---

#### `DELETE /api/subscribe/:channelId` 🔒

**Response `200`** — `{ "message": "Unsubscribed successfully" }`

---

#### `GET /api/subscriptions` 🔒

Get all channels the user is subscribed to.

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "subscription-uuid",
      "channel": {
        "id": "channel-uuid",
        "username": "channelname",
        "displayName": "Channel Name",
        "avatarUrl": "https://s3..."
      }
    }
  ]
}
```

---

#### `GET /api/subscriptions/videos` 🔒

Get the latest videos from all subscribed channels.

**Response `200`** — `{ "success": true, "videos": [...] }`

---

#### `GET /api/subscribers/:channelId`

Get the subscriber count for any channel. No auth required.

**Response `200`** — `{ "subscribers": 1500 }`

---

#### `GET /api/subscribe/check/:channelId` 🔒

Check whether the authenticated user is subscribed to a channel.

**Response `200`** — `{ "subscribed": true }`

---

### Recommendations

#### `GET /api/videos/:id/recommendations`

Watch-page sidebar recommendations. Merges three ranked sources with explainable reason tags.

| Priority | Source | Reason Tag |
|---|---|---|
| 1st | Same creator — newest first | `same_creator` |
| 2nd | Collaborative filtering — co-watch frequency | `collaborative` |
| 3rd | Trending fallback | `trending` |

**Response `200`**
```json
{
  "recommendations": [
    {
      "id": "video-uuid",
      "reason": "same_creator",
      "user": { "..." : "..." }
    }
  ]
}
```

---

#### `GET /api/videos/:id/recommend`

Related videos ranked by co-watch frequency. No auth required.

**Response `200`** — `{ "videos": [...] }`

---

#### `GET /api/videos/:id/autoplay` 🔒

Get the next autoplay video using a three-step fallback chain.

```
Step 1 — Newest unwatched video from same creator
Step 2 — getVideoRecommendations(videoId, 5) → first not in completed history
Step 3 — Top trending video not in completed history
```

**Response `200`**
```json
{
  "next": {
    "id": "video-uuid",
    "title": "Next Video",
    "autoplayReason": "same_creator",
    "user": { "..." : "..." }
  }
}
```

**No next video:** `{ "next": null }`

---

#### `GET /api/videos/:id/related` 🔒

Related videos via co-watch frequency (same as `/recommend` but auth-gated for personalized deduplication).

**Response `200`** — `{ "videos": [...] }`

---

### Analytics

#### `GET /api/analytics/video/:videoId` 🔒

Per-video performance metrics. Only accessible by the video owner.

**Response `200`**
```json
{
  "success": true,
  "videoId": "video-uuid",
  "title": "My Video",
  "views": 1000,
  "watchTimeSeconds": 45000,
  "watchTimeMinutes": 750.00,
  "watchTimeHours": 12.50,
  "subscribersGained": 25,
  "likes": 150,
  "comments": 30
}
```

> `subscribersGained` counts users who subscribed via this video using the `subscribedFromVideoId` attribution field on subscription records.

---

### Thumbnails

#### `PUT /api/thumbnail/:videoId` 🔒

Replace a video's thumbnail. Accepts `multipart/form-data` with a `thumbnail` file field.

**Response `200`**
```json
{
  "message": "Thumbnail replaced successfully",
  "thumbnailUrl": "https://s3..."
}
```

**Error `400`** — `No file uploaded`

---

#### `DELETE /api/thumbnail/:videoId` 🔒

Remove the custom thumbnail. The auto-generated thumbnail remains.

**Response `200`** — `{ "message": "Thumbnail removed" }`

---

## WebSocket Events

**Connection URL:** `http://localhost:8000`  
**Auth:** Pass the JWT in `auth.token` at handshake time.

```javascript
const socket = io("http://localhost:8000", {
  auth: { token: "your-jwt-token" }
});
```

Each authenticated user is automatically joined to a private room `user:{userId}` and only receives their own events.

### `video:update`

Fired on upload progress changes and processing status transitions.

```javascript
socket.on("video:update", (data) => {
  console.log(data);
  // { videoId, status, uploadProgress, error }
});
```

**Example payloads**

```json
{ "videoId": "uuid", "uploadProgress": 75 }
{ "videoId": "uuid", "status": "PROCESSING", "uploadProgress": 100 }
{ "videoId": "uuid", "status": "READY" }
{ "videoId": "uuid", "status": "PROCESSING_FAILED", "error": "FFmpeg error" }
```

---

## Video Processing Workflow

Handled by `worker.js` using BullMQ.

| Property | Value |
|---|---|
| Queue name | `video-processing` |
| Concurrency | 2 parallel jobs |
| Rate limit | 5 jobs per 60 seconds |
| Max retries | 3 attempts |

**Processing stages:**

```
DOWNLOAD   → Fetch raw file from S3_RAW_BUCKET to /tmp/yt-worker/
TRANSCODE  → FFmpeg HLS encoding — 360p (800 Kbps) + 720p (2800 Kbps)
UPLOAD     → Push .m3u8 playlists + .ts segments to S3_PROCESSED_BUCKET
FINALIZE   → Update DB status to READY, save masterPlaylist URL
```

- Thumbnail auto-generated at the **10% timestamp** if not provided at upload
- All temp files deleted after processing completes
- On failure → status set to `PROCESSING_FAILED`, `processingAttempts` incremented
- Retry via `POST /api/videos/:id/retry-processing` (max 3)

---

## Search Algorithm

Implemented in `services/search/`.

### Candidate Generation

| Strategy | Method | Limit |
|---|---|---|
| Full-text search | `plainto_tsquery('english', q)` | 5,000 videos / 2,000 channels |
| Prefix match | `title ILIKE 'token%'` | 2,000 videos / 1,000 channels |
| Trigram fuzzy | `similarity(title, q) > 0.3` | 2,000 videos / 1,000 channels |
| Token OR expansion | `to_tsquery('t1 \| t2')` | 2,000 videos |

All candidates merged into a deduplicated Set. Cached in Redis for **60 seconds**.

### Ranking Formula

```
score = textScore   × 0.40   (normalized text relevance)
      + engagement  × 0.25   (views / 1,000,000)
      + freshness   × 0.20   (exp(-ageDays / 30))
      + intentBoost × 0.15
```

### Personalization Multipliers

| Signal | Multiplier |
|---|---|
| Video already watched | × 0.70 |
| Channel user completed videos on | × 1.15 |
| User completed this specific video | × 1.10 |
| Subscribed channel | × 1.30 |
| Channel in recent watch history | × 1.15 |

### Result Blending

Pattern: **3 videos → 1 channel → repeat**  
Pagination: base64-encoded cursor `{ videoIndex, channelIndex }`

---

## View Counting Logic

Implemented in `controllers/recordView.controller.js`.

```
View qualifies if:
  watchDuration >= 20 seconds
  OR
  watchDuration >= 30% of video duration
```

- View counted **once per user per video** — checked against `WatchHistory` before incrementing
- If a user re-watches and qualifies this time but didn't before, it counts now
- `WatchHistory` is always **upserted** regardless of whether the view qualifies — `watchDuration` and `completed` flag are always updated

---

## Error Handling

All error responses follow a consistent format:

```json
{ "message": "Something went wrong!" }
```

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request — validation failed |
| `401` | Unauthorized — missing or invalid token |
| `403` | Forbidden — not the resource owner |
| `404` | Resource not found |
| `409` | Conflict — e.g. retry limit exceeded |
| `500` | Internal server error |

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy and fill environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start Redis (separate terminal)
redis-server

# Start API server
npm start

# Start video processing worker (separate terminal)
node worker.js
```

**API server:** `http://localhost:8000`  
**WebSocket:** Initialized on the same server port.