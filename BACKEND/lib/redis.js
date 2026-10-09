const Redis = require("ioredis");
console.log("REDIS_URL:", process.env.REDIS_URL?.slice(0, 50)); 
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      tls: { rejectUnauthorized: false },
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  : new Redis({
      host: "localhost",
      port: 6379,
    });

module.exports = redis;
// const redis = new Redis({
//   host: process.env.REDIS_HOST,
//   port: Number(process.env.REDIS_PORT),
// });
// redis.on("connect", () => {
//   console.log("Redis connected");
// });

// module.exports = redis;