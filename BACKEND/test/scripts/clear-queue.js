    const { Queue } = require("bullmq");

const clearQueue = async () => {
const queue = new Queue("video-processing", {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    tls: {},
  },
});

  await queue.obliterate({ force: true });
  console.log("✅ Queue cleared");
  process.exit(0);
};

clearQueue();