const Redis = require("ioredis");

const publisher = new Redis(process.env.REDIS_URL, {
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const publishVideoUpdate = async (userId, videoId, data) => {
  await publisher.publish(
    "video:updates",
    JSON.stringify({ userId, videoId, ...data })
  );
};

module.exports = { publishVideoUpdate };
// const Redis = require("ioredis");

// const publisher = new Redis({
//   host: process.env.REDIS_HOST || "localhost",
//   port: parseInt(process.env.REDIS_PORT) || 6379,
//   ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
//   ...(process.env.REDIS_TLS === "true" && { tls: {} }),
// });

// const publishVideoUpdate = async (userId, videoId, data) => {
//   await publisher.publish(
//     "video:updates",
//     JSON.stringify({ userId, videoId, ...data })
//   );
// };

// module.exports = { publishVideoUpdate };