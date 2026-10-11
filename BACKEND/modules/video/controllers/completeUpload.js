const { PrismaClient } = require("@prisma/client");
const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { videoQueue } = require("../../../queues/videoQueue");
const { emitVideoUpdate } = require("../../../websocket");
const { s3 } = require("../../../config/s3");

const prisma = new PrismaClient();


const completeUpload = async (req, res) => {
  try {
    const { videoId } = req.body;
    const userId = req.user.id;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        userId: true,
        status: true,
        originalFileUrl: true,
      },
    });

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (video.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (video.status !== "UPLOADING") {
      return res.json({
        message: "Video already processed or processing",
        status: video.status,
      });
    }

    // VERIFY FILE EXISTS IN S3 (NO SIZE CHECK)
    try {
      const headResult = await s3.send(
        new HeadObjectCommand({
          Bucket: process.env.S3_RAW_BUCKET,
          Key: video.originalFileUrl,
        })
      );

      if (!headResult || !headResult.ContentLength || headResult.ContentLength <= 0) {
        throw new Error("Invalid uploaded file");
      }

    } catch (err) {
      console.error("S3 verification failed:", err);

      await prisma.video.update({
        where: { id: videoId },
        data: { status: "FAILED" },
      });

      emitVideoUpdate(userId, videoId, {
        status: "FAILED",
        error: "File not found or invalid",
      });

      return res.status(400).json({
        message: "Upload failed or file missing",
      });
    }

    //UPDATE STATUS
   //UPDATE STATUS
const updatedVideo = await prisma.video.update({
  where: { id: videoId },
  data: {
    status: "PROCESSING",
    uploadProgress: 100,
  },
});

console.log(` Video ${videoId} updated to PROCESSING`);
console.log(` S3 Key: ${video.originalFileUrl}`);
    //ADD TO QUEUE
    await videoQueue.add(
      "process-video",
      {
        videoId,
        userId,
        s3Key: video.originalFileUrl,
      },
      {
        jobId: videoId,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      }
    );
console.log(` Job ${videoId} added to queue`);
    //WEBSOCKET UPDATE
    emitVideoUpdate(userId, videoId, {
      status: "PROCESSING",
      uploadProgress: 100,
    });

    return res.json({
      message: "Video processing started",
      videoId,
      status: "PROCESSING",
    });

  } catch (err) {
    console.error("Complete upload error:", err);
    return res.status(500).json({ message: "Processing failed" });
  }
};

module.exports = { completeUpload };
