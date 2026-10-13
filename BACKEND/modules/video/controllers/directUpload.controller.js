const fs = require("fs");
const path = require("path");
const os = require("os");
const { pipeline } = require("stream/promises");
const { PrismaClient } = require("@prisma/client");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("../../../config/s3");

const prisma = new PrismaClient();

/**
 * Resilient direct-to-S3 streaming proxy via backend.
 * Streams the incoming request body to a temporary disk buffer and forwards to S3.
 * Serves as an automatic fallback when browser direct S3 PUT faces CORS or network blocks.
 */
const directUploadFile = async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user.id;
  const tempFilePath = path.join(os.tmpdir(), `stream_${videoId}_${Date.now()}.tmp`);

  try {
    req.pause();
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video || video.userId !== userId) {
      req.resume();
      return res.status(404).json({ message: "Video not found or unauthorized" });
    }

    const MAX_DIRECT_SIZE = 5 * 1024 * 1024 * 1024; // 5GB limit
    const reportedLength = parseInt(req.headers["content-length"] || "0", 10);
    if (reportedLength > MAX_DIRECT_SIZE) {
      return res.status(400).json({ message: "File exceeds 5GB maximum upload size" });
    }

    const contentType = video.mimeType || req.headers["content-type"] || "video/mp4";
    console.log(`[DIRECT_UPLOAD] Streaming video ${videoId} to temp file: ${tempFilePath}`);

    // Stream incoming HTTP request bytes to temporary file on disk
    const fileWriteStream = fs.createWriteStream(tempFilePath);
    await pipeline(req, fileWriteStream);

    const stats = fs.statSync(tempFilePath);
    if (stats.size > MAX_DIRECT_SIZE) {
      return res.status(400).json({ message: "Uploaded file exceeds 5GB maximum limit" });
    }
    console.log(`[DIRECT_UPLOAD] Temp file written (${stats.size} bytes). Forwarding to S3...`);

    const fileReadStream = fs.createReadStream(tempFilePath);

    const command = new PutObjectCommand({
      Bucket: process.env.S3_RAW_BUCKET,
      Key: video.originalFileUrl,
      ContentType: contentType,
      ContentLength: stats.size,
      Body: fileReadStream,
    });

    await s3.send(command);

    console.log(`[DIRECT_UPLOAD] Video ${videoId} successfully forwarded to S3!`);

    res.json({
      success: true,
      message: "File uploaded successfully via streaming channel",
      videoId,
    });
  } catch (err) {
    console.error("[DIRECT_UPLOAD] Stream upload error:", err);
    res.status(500).json({
      message: err.message || "Direct upload streaming failed",
      error: err.name || "UPLOAD_STREAM_ERROR",
    });
  } finally {
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanErr) {
        console.warn("[DIRECT_UPLOAD] Failed to remove temp file:", cleanErr.message);
      }
    }
  }
};

module.exports = { directUploadFile };

