const client = require("prom-client");

client.collectDefaultMetrics();

const videoUploadCounter = new client.Counter({
  name: "video_uploads_total",
  help: "Total video uploads",
});

const jobQueueGauge = new client.Gauge({
  name: "job_queue_size",
  help: "Current jobs waiting in queue",
});

const transcodeDuration = new client.Histogram({
  name: "transcode_duration_seconds",
  help: "Video transcoding duration in seconds",
  buckets: [30, 60, 120, 300, 600],
});

const activeConnections = new client.Gauge({
  name: "websocket_connections_active",
  help: "Active WebSocket connections",
});

const apiRequestDuration = new client.Histogram({
  name: "api_request_duration_seconds",
  help: "API request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
});

const failedJobsCounter = new client.Counter({
  name: "worker_jobs_failed_total",
  help: "Total failed video processing jobs",
});

const completedJobsCounter = new client.Counter({
  name: "worker_jobs_completed_total",
  help: "Total completed video processing jobs",
});

module.exports = {
  client,
  videoUploadCounter,
  jobQueueGauge,
  transcodeDuration,
  activeConnections,
  apiRequestDuration,
  failedJobsCounter,
  completedJobsCounter,
};