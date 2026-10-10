const { Queue } = require("bullmq");

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
  ...(process.env.REDIS_TLS === "true" ? { tls: { rejectUnauthorized: false } } : {}),
};

const videoQueue = new Queue("video-processing", { connection });

module.exports = { videoQueue };