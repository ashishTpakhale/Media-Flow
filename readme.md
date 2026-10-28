# 🎬 Media Flow

> A distributed video streaming platform with direct-to-storage uploads, asynchronous FFmpeg transcoding, adaptive HLS playback, real-time processing updates, and hybrid discovery logic.

![MediaFlow Architecture](docs/architecture/mediaflow-architecture.png)

---

## Overview

Media Flow is a full-stack media platform designed for modern video delivery at scale. It separates user-facing request handling from expensive media processing so that uploads, transcoding, and real-time status updates do not block the core API lifecycle.

The system combines:
- direct browser-to-storage uploads via presigned URLs
- asynchronous video processing with BullMQ and Redis
- FFmpeg-based transcoding to HLS renditions
- real-time upload and processing status updates via Socket.IO
- durable metadata storage in PostgreSQL
- search, ranking, and recommendation capabilities for discovery

The central design principle is simple:

> Keep latency-sensitive requests fast while moving CPU-intensive and failure-prone media work into background workers.

---

## Why this architecture?

| Concern | Implementation | Engineering benefit |
|---|---|---|
| Large file transfer | Presigned S3-compatible URLs | Browser uploads bypass the main API server |
| Expensive transcoding | `queues/videoQueue.js`, `worker.js` | FFmpeg work runs outside the request lifecycle |
| Persistent app state | PostgreSQL + Prisma | Users, videos, uploads, and processing state are modeled relationally |
| Job coordination | BullMQ + Redis | Tasks can queue, retry, and be consumed independently |
| Real-time progress | Socket.IO + Redis Pub/Sub | Clients get updates without continuous polling |
| Search relevance | `modules/search/services/search.service.js` | Full-text, substring, prefix, and trigram matching are combined |
| Feed personalization | `modules/recommendation/services/hybridRank.service.js` | Trending, personal, and collaborative signals are blended into ranking |

---

## Architecture

```text
Client (React + HLS.js)
   │  REST / JWT                         ▲ Socket.IO
   ▼                                     │
Express API ──► PostgreSQL (Prisma)      │
   │                                     │
   ├──► Redis + BullMQ ──► FFmpeg Worker ┤
   │                          │          │
   │                          ├──► Redis Pub/Sub ──► API subscriber ──► Socket.IO
   │                          └──► Processed storage (HLS playlists + segments)
   └──► Presigned URLs ──► S3-compatible raw storage
```

### Upload and processing flow

1. The client requests a presigned URL from the API and uploads the raw video directly to object storage.
2. The client completes the upload flow; the API verifies the object exists, updates the video state, and enqueues a processing job.
3. A worker downloads the source video, extracts metadata, generates a thumbnail, transcodes HLS renditions, and uploads processed outputs.
4. The worker updates PostgreSQL status and publishes progress over Redis Pub/Sub.
5. The API subscriber forwards updates to connected clients over Socket.IO.
6. When processing succeeds, the video becomes `READY` and is served using adaptive HLS playback.

---

## Key engineering challenges

### 1. Large uploads and storage boundaries
Relevant files:
- `BACKEND/modules/video/controllers/upload.js`
- `BACKEND/modules/video/controllers/directUpload.controller.js`
- `BACKEND/modules/video/controllers/chunkUpload.controller.js`
- `BACKEND/modules/video/controllers/completeUpload.js`

The platform uses presigned PUT URLs so browsers upload directly to storage rather than proxying large files through Express. This reduces API pressure and keeps upload transfer separate from metadata processing.

The important learning here is that upload transfer, metadata persistence, and upload completion are distinct operations; success in one does not guarantee success in the others.

### 2. Asynchronous processing and retries
Relevant files:
- `BACKEND/modules/video/controllers/completeUpload.js`
- `BACKEND/queues/videoQueue.js`
- `BACKEND/worker.js`
- `BACKEND/modules/video/controllers/videoRetry.controller.js`

Once the source object is confirmed, the API updates video state and enqueues a background job. The worker then handles FFmpeg transcoding, metadata extraction, thumbnail generation, HLS output generation, and final status updates.

The key challenge is coordinating a database state machine with a separate queue. Partial progress, retries, and duplicate execution require careful idempotent design.

### 3. Real-time updates across processes
Relevant files:
- `BACKEND/websocket.js`
- `BACKEND/redis/publisher.js`
- `BACKEND/worker.js`

The API server owns Socket.IO connections while workers publish progress through Redis Pub/Sub. This allows separate processes to communicate without sharing memory.

The key architectural rule is that WebSocket and Pub/Sub messages are not durable records. Clients may disconnect, and messages can be missed. PostgreSQL remains the source of truth for processing state.

### 4. Search and feed relevance
Relevant files:
- `BACKEND/modules/search/services/search.service.js`
- `BACKEND/modules/recommendation/services/hybridRank.service.js`
- `BACKEND/services/trending.service.js`
- `BACKEND/services/collaborative.service.js`

Search and feed ranking are not built around a single exact-match query. The platform blends full-text, substring, prefix, and trigram matching, then combines trending, personal, and collaborative signals into a hybrid ranking model.

This is a practical production-style baseline for discovery and recommendation, emphasizing retrieval quality, ranking quality, cache freshness, and query cost trade-offs.

---

## Features

- direct browser-to-storage uploads
- asynchronous FFmpeg transcoding
- HLS adaptive streaming support
- real-time processing and upload progress updates
- PostgreSQL-backed relational state management
- multi-strategy search and recommendation logic

---

## Tech Stack

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- FFmpeg
- S3-compatible storage
- Socket.IO

### Frontend
- React
- Vite
- HLS.js
- Socket.IO client
- Zustand
- Tailwind CSS

---

## Repository Structure

```text
Media-Flow/
├── BACKEND/
│   ├── config/
│   ├── modules/
│   │   ├── analytics/
│   │   ├── auth/
│   │   ├── feed/
│   │   ├── recommendation/
│   │   ├── search/
│   │   ├── subscription/
│   │   ├── thumbnail/
│   │   └── video/
│   ├── prisma/
│   ├── queues/
│   ├── redis/
│   ├── services/
│   ├── server.js
│   ├── worker.js
│   ├── logger.js
│   └── package.json
├── FRONTEND/
│   ├── src/
│   ├── public/
│   └── package.json
├── docs/
│   └── architecture/
│       └── mediaflow-architecture.png
├── README.md
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- FFmpeg installed and available on your `PATH`
- S3-compatible storage or MinIO

### 1. Clone the repository

```bash
git clone https://github.com/ashishTpakhale/Media-Flow.git
cd Media-Flow
```

### 2. Install backend dependencies

```bash
cd BACKEND
npm install
```

### 3. Install frontend dependencies

```bash
cd ../FRONTEND
npm install
```

### 4. Configure environment variables

Set up your environment variables for:
- database connection
- Redis connection
- S3 endpoint and bucket names
- JWT secret
- frontend/backend URLs

Example:

```env
PORT=8000
DATABASE_URL=postgresql://user:password@localhost:5432/mediaflow
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=http://localhost:9000
S3_RAW_BUCKET=raw-videos
S3_PROCESSED_BUCKET=processed-videos
JWT_SECRET=your_secret
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
```

### 5. Start the backend

```bash
cd BACKEND
npm run dev
```

### 6. Start the worker

```bash
cd BACKEND
node worker.js
```

### 7. Start the frontend

```bash
cd FRONTEND
npm run dev
```

---

## Production considerations

This project demonstrates a strong architecture for a streaming platform prototype or engineering interview project, but production hardening would still require additional work in a few areas:

- resumable upload recovery
- dead-letter and retry policies for background jobs
- idempotent processing guarantees
- durable event replay on reconnect
- stronger observability and alerting
- cache invalidation and freshness strategies

The current architecture is thoughtful and practical, but it is not a full production-grade platform out of the box.

---

## Contributing

Contributions are welcome. If you want to improve the architecture, enhance reliability, or add new features:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Open a pull request with a clear description of the problem and solution

---

## License

This repository is intended for educational, learning, and portfolio-style development. Please review and include an appropriate license file before commercial or public redistribution.

---

Media Flow is a strong example of how to architect a media platform with scalable upload handling, background transcoding, real-time state synchronization, and intelligent discovery features in a modular and maintainable way.
