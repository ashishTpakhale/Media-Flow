# Docker Environment Setup

This Docker Compose configuration sets up all the required services for your application.

## Services Included

- **PostgreSQL** (port 5432): Database server
- **Redis** (port 6379): Cache and message broker
- **MinIO** (ports 9000, 9001): S3-compatible object storage
  - Port 9000: API endpoint
  - Port 9001: Web console

## Quick Start

### 1. Start all services
```bash
docker-compose up -d
```

### 2. Check service status
```bash
docker-compose ps
```

### 3. View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f minio
```

### 4. Stop all services
```bash
docker-compose down
```

### 5. Stop and remove volumes (⚠️ This will delete all data)
```bash
docker-compose down -v
```

## Service Details

### PostgreSQL
- **Host**: localhost
- **Port**: 5432
- **Database**: appdb
- **User**: postgres
- **Password**: postgres

### Redis
- **Host**: localhost
- **Port**: 6379
- **No authentication** (default setup)

### MinIO
- **API Endpoint**: http://localhost:9000
- **Console**: http://localhost:9001
- **Access Key**: admin
- **Secret Key**: password

#### Pre-created Buckets
The setup automatically creates these buckets:
- `user-media`
- `raw-videos`
- `processed-videos`

All buckets are set to allow public downloads.

## MinIO Console Access

1. Open http://localhost:9001 in your browser
2. Login with:
   - **Username**: admin
   - **Password**: password

## Connecting from Your Application

Your `.env` file is already configured correctly:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/appdb"
REDIS_HOST=localhost
REDIS_PORT=6379
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=admin
S3_SECRET_KEY=password
```

## Troubleshooting

### Ports already in use
If you get port conflicts, you can change the ports in `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Use 5433 instead of 5432
```

### Bucket creation failed
If buckets aren't created automatically, create them manually:
```bash
docker exec -it minio-setup /bin/sh
mc alias set myminio http://minio:9000 admin password
mc mb myminio/user-media
mc mb myminio/raw-videos
mc mb myminio/processed-videos
```

### Reset everything
```bash
docker-compose down -v
docker-compose up -d
```

## Production Considerations

For production use, you should:
1. Change all default passwords
2. Use environment variables or secrets management
3. Configure proper network security
4. Set up SSL/TLS for MinIO
5. Configure backup strategies for volumes
6. Use stronger authentication for Redis