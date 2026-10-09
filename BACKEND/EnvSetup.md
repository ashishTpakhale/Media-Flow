# Environment Setup Guide

This guide covers all environment variables and service setup for the YouTube clone backend.

---

## `.env` File

Create a `.env` file in the project root:

```env
# ─── Server ───────────────────────────────────────────
PORT=8000
CLIENT_URL=http://localhost:5173

# ─── Auth ─────────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars

# ─── Database ─────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/ytclone

# ─── Redis ────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379

# ─── MinIO / S3 ───────────────────────────────────────
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_FORCE_PATH_STYLE=true

S3_RAW_BUCKET=raw-videos
S3_PROCESSED_BUCKET=processed-videos
S3_USER_MEDIA_BUCKET=user-media
```

---

## Variable Reference

### Server

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | HTTP server port |
| `CLIENT_URL` | — | Frontend origin for CORS (not currently enforced — `cors()` allows all) |

### Authentication

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | HMAC-SHA256 signing key. Minimum 32 random characters. Used for both REST JWT and WebSocket JWT. |

Generate a strong secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Tokens expire in **1 hour**. There is no refresh token mechanism — clients must re-login.

### Database

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string for Prisma |

Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

Required PostgreSQL extensions:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

`uuid-ossp` is used for UUID generation.  
`pg_trgm` is required for the `similarity()` function used in fuzzy search.

### Redis

| Variable | Default | Description |
|---|---|---|
| `REDIS_HOST` | `localhost` | Redis host (used by BullMQ worker + queue) |
| `REDIS_PORT` | `6379` | Redis port |

> **Note:** The `lib/redis.js` ioredis client is hardcoded to `127.0.0.1:6379`. If deploying remotely, update that file too.

Used for:
- Search candidate cache (TTL: 60s)
- Hybrid feed cache (TTL: 60s per user)
- Search context store (TTL: 10min)
- BullMQ job queue (`video-processing`)

### MinIO / S3

| Variable | Required | Description |
|---|---|---|
| `S3_ENDPOINT` | ✅ | Full URL to MinIO (e.g. `http://localhost:9000`) |
| `S3_REGION` | ✅ | Region string (e.g. `us-east-1` — MinIO ignores this but SDK requires it) |
| `S3_ACCESS_KEY` | ✅ | MinIO access key |
| `S3_SECRET_KEY` | ✅ | MinIO secret key |
| `S3_FORCE_PATH_STYLE` | `true` | Must be `true` for MinIO path-style URLs |
| `S3_RAW_BUCKET` | ✅ | Bucket for original uploaded videos |
| `S3_PROCESSED_BUCKET` | ✅ | Bucket for HLS output + thumbnails |
| `S3_USER_MEDIA_BUCKET` | ✅ | Bucket for avatars and channel banners |

Thumbnail URLs are constructed as:
```
${S3_ENDPOINT}/${S3_PROCESSED_BUCKET}/thumbnails/{videoId}.jpg
```

Stream URLs are constructed as:
```
http://localhost:9000/${S3_PROCESSED_BUCKET}/videos/{videoId}/master.m3u8
```

> **Production note:** The stream URL in `video.controller.js` is hardcoded to `http://localhost:9000`. Update this to use `S3_ENDPOINT` for production deployments.

---

## Docker Compose (Local Dev)

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ytclone
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"   # S3 API
      - "9001:9001"   # MinIO Console (web UI)
    volumes:
      - minio_data:/data

volumes:
  pg_data:
  minio_data:
```

---

## MinIO Bucket Setup

After starting MinIO, create the three required buckets. Use the MinIO Console at `http://localhost:9001` or the CLI:

```bash
# Install mc (MinIO CLI)
brew install minio/stable/mc  # macOS
# or download from https://min.io/docs/minio/linux/reference/minio-mc.html

mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/raw-videos
mc mb local/processed-videos
mc mb local/user-media

# Set public read policy on processed-videos (for streaming)
mc anonymous set download local/processed-videos
mc anonymous set download local/user-media
```

---

## PostgreSQL Setup

```bash
# Run migrations
npx prisma migrate dev --name init

# Required extensions (if not already present)
psql -U postgres -d ytclone -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -U postgres -d ytclone -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

---

## FFmpeg

The video processing worker requires FFmpeg installed on the machine where `worker.js` runs.

```bash
# Ubuntu / Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Verify
ffmpeg -version
ffprobe -version
```

---

## Service Health Checks

| Service | Check |
|---|---|
| API server | `GET http://localhost:8000/health` → `{ "status": "ok" }` |
| PostgreSQL | `psql -U postgres -c "\l"` |
| Redis | `redis-cli PING` → `PONG` |
| MinIO | `http://localhost:9001` (web console) |

---

## Production Checklist

- [ ] `JWT_SECRET` is at least 32 random characters (not a dictionary word)
- [ ] PostgreSQL password is not the default
- [ ] Redis is password-protected (`requirepass` in redis.conf)
- [ ] MinIO access keys are rotated from defaults
- [ ] `S3_ENDPOINT` uses HTTPS in production
- [ ] Stream URL in `video.controller.js` updated to use `S3_ENDPOINT`
- [ ] `lib/redis.js` host updated from hardcoded `127.0.0.1` to `REDIS_HOST`
- [ ] FFmpeg installed on worker server
- [ ] `pg_trgm` extension installed in production PostgreSQL
- [ ] `processed-videos` and `user-media` buckets have public read access (or use signed URLs)
- [ ] `cleanup.js` scheduled via cron (e.g. every 15 minutes)