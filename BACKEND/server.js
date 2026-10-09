require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const cron = require("node-cron");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const promClient = require("prom-client");
const { Pushgateway } = promClient;
const logger = require("./logger");

const { initializeWebSocket } = require("./websocket");
const authRoutes = require("./modules/auth/routes/authRoutes");
const videoRoutes = require("./modules/video/routes/video.routes");
const subscriptionRoutes = require("./modules/subscription/routes/subscription.routes");
const feedRoutes = require("./modules/feed/routes/feed.routes");
const recommendationRoutes = require("./modules/recommendation/routes/recommendation.routes");

// ── Prometheus metrics ────────────────────────────────
const apiRequestDuration = new promClient.Histogram({
  name: "api_request_duration_seconds",
  help: "Duration of API requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});
const app = express();
const server = http.createServer(app);

// ── Rate limiting ─────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { error: "Too many requests" },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: { error: "Upload limit reached" },
});

app.use(cors());
app.use(express.json());
app.use("/api", limiter);
app.use("/api/videos/upload", uploadLimiter);

// ── Request duration metrics ──────────────────────────
app.use((req, res, next) => {
  const end = apiRequestDuration.startTimer();

  res.on("finish", () => {
    end({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode,
    });
  });

  next();
});

// ── Request logging ───────────────────────────────────
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip });
  next();
});

// Initialize WebSocket
initializeWebSocket(server);

// Routes
app.use("/api", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api", subscriptionRoutes);
app.use("/api/search", require("./modules/search/routes/search.routes"));
app.use("/api", recommendationRoutes);
app.use("/api", require("./modules/thumbnail/routes/thumbnail.routes"));
app.use("/api/analytics", require("./modules/analytics/routes/analytics.routes"));

// ── Health check ──────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date() });
});

// ── Prometheus metrics endpoint ───────────────────────
app.get("/metrics", async (req, res) => {
res.set("Content-Type", promClient.register.contentType);
res.end(await promClient.register.metrics());
});

// ── Error handling ────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error({ message: err.message, stack: err.stack, url: req.url });
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// ── Self ping ─────────────────────────────────────────
cron.schedule("*/14 * * * *", async () => {
  try {
    await axios.get(`${process.env.BACKEND_URL}/health`);
    logger.info("Backend self-ping ok");
  } catch (err) {
    logger.warn("Backend self-ping failed");
  }
});

// ── Grafana push (only if URL is set) ─────────────────
// change this:
if (process.env.GRAFANA_PUSH_URL) {
  const gateway = new Pushgateway(process.env.GRAFANA_PUSH_URL);
  setInterval(async () => {
    try {
      await gateway.pushAdd({ jobName: "yt-backend" });
    } catch (err) {
      logger.warn("Metrics push failed");
    }
  }, 15000);
}