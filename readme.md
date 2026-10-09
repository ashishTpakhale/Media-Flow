# 🎬 Media Flow

> A full-stack, distributed video streaming and transcoding platform.

---

## 📌 Overview

**Media Flow** is an end-to-end video streaming platform designed to handle direct-to-storage uploads, asynchronous HLS transcoding, adaptive bitrate streaming, personalized recommendations, and real-time processing updates.

### ⚡ Highlights

- **Direct Storage Uploads:** Presigned S3 URLs bypass the API server for fast, direct media uploads.
- **Asynchronous Processing:** BullMQ & Redis worker queue with FFmpeg multi-bitrate HLS transcoding (360p & 720p).
- **Adaptive Bitrate Streaming:** Smooth HLS playback with dynamic quality switching.
- **Real-Time Updates:** WebSockets (Socket.IO) for instant upload & transcoding progress feedback.
- **Recommendation & Search:** Multi-signal recommendation engine and PostgreSQL full-text search with trigram fuzzy matching.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS / Vanilla CSS, Socket.IO Client, HLS.js
- **Backend:** Node.js, Express.js, Prisma ORM, PostgreSQL
- **Media & Workers:** FFmpeg, MinIO (S3-compatible storage), BullMQ, Redis

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/<YOUR_USERNAME>/Media-Flow.git
cd Media-Flow
```

### 2. Configure Environment Variables
Copy `.env.example` in both `BACKEND` and `FRONTEND` to `.env` and fill in your credentials:
```bash
cp BACKEND/.env.example BACKEND/.env
cp FRONTEND/.env.example FRONTEND/.env
```

### 3. Run Locally
```bash
# Backend
cd BACKEND
npm install
npx prisma migrate dev
npm run dev

# Frontend (in a separate terminal)
cd ../FRONTEND
npm install
npm run dev
```

---

*Note: Detailed system architecture diagrams and API documentation will be added after final release.*
