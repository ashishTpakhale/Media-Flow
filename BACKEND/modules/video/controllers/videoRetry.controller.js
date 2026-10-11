const { PrismaClient } = require("@prisma/client");
const { Queue } = require("bullmq");

const prisma = new PrismaClient();

// Must match worker queue name exactly
// const videoQueue = new Queue("video-processing", {
//   connection: {
//     host: process.env.REDIS_HOST || "localhost",
//     port: process.env.REDIS_PORT || 6379,
//   },
// });

const videoQueue = new Queue("video-processing", {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    tls: { rejectUnauthorized: false }, // ← fix
  },
});
const retryProcessing = async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.id;

    // Fetch video
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Ownership check
    if (video.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Validate retryable state
const MAX_RETRIES = 3;

if (video.status !== "PROCESSING_FAILED") {
  return res.status(400).json({
    message: "Video is not retryable",
    status: video.status,
  });
}

if (video.processingAttempts >= MAX_RETRIES) {
  return res.status(409).json({
    message: "Retry limit exceeded",
    attempts: video.processingAttempts,
    maxRetries: MAX_RETRIES,
  });
}


    // 4️ Reset failure state
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "PROCESSING",
        errorMessage: null,
        processingStage: null,
      },
    });

    // 5️ Re-enqueue job
    await videoQueue.add("process-video", {
      videoId: video.id,
      userId: video.userId,
      s3Key: video.originalFileUrl,
    });

    return res.json({
      message: "Processing retry started",
      videoId,
    });

  } catch (error) {
    console.error("Retry processing failed:", error);
    return res.status(500).json({
      message: "Retry processing failed",
      error: error.message,
    });
  }
};

module.exports = { retryProcessing };
