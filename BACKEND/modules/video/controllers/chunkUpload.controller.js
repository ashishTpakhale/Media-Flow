const { PrismaClient } = require("@prisma/client");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3 } = require("../../../config/s3");

const prisma = new PrismaClient();

/**
 * Initiates a multi-chunk upload session
 */
const initChunkSession = async (req, res) => {
  try {
    const { videoId, totalChunks, chunkSize, totalSize } = req.body;
    const userId = req.user.id;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video || video.userId !== userId) {
      return res.status(404).json({ message: "Video not found or forbidden" });
    }

    const session = await prisma.uploadSession.upsert({
      where: { videoId },
      update: {
        totalChunks: Number(totalChunks) || 1,
        chunkSize: Number(chunkSize) || 5 * 1024 * 1024,
        totalSize: BigInt(totalSize || 0),
        status: "IN_PROGRESS",
      },
      create: {
        videoId,
        totalChunks: Number(totalChunks) || 1,
        chunkSize: Number(chunkSize) || 5 * 1024 * 1024,
        totalSize: BigInt(totalSize || 0),
        status: "IN_PROGRESS",
      },
    });

    res.json({
      success: true,
      sessionId: session.id,
      videoId,
      totalChunks: session.totalChunks,
      chunkSize: session.chunkSize,
    });
  } catch (err) {
    console.error("initChunkSession error:", err);
    res.status(500).json({ message: "Failed to initialize chunk session" });
  }
};

/**
 * Generates presigned URL for a specific chunk or records chunk completion
 */
const getChunkUploadUrl = async (req, res) => {
  try {
    const { sessionId, chunkIndex } = req.body;

    const session = await prisma.uploadSession.findUnique({
      where: { id: sessionId },
      include: { video: true },
    });

    if (!session || !session.video) {
      return res.status(404).json({ message: "Upload session not found" });
    }

    if (session.video.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Not authorized for this upload session" });
    }

    const chunkKey = `raw/${session.videoId}/chunks/part_${chunkIndex}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_RAW_BUCKET,
      Key: chunkKey,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    res.json({
      uploadUrl,
      chunkKey,
      chunkIndex,
    });
  } catch (err) {
    console.error("getChunkUploadUrl error:", err);
    res.status(500).json({ message: "Failed to generate chunk URL" });
  }
};

/**
 * Records that a chunk has been uploaded
 */
const recordChunkUploaded = async (req, res) => {
  try {
    const { sessionId, chunkIndex, chunkSize, checksum } = req.body;

    const session = await prisma.uploadSession.findUnique({
      where: { id: sessionId },
      include: { video: true },
    });

    if (!session || !session.video) {
      return res.status(404).json({ message: "Upload session not found" });
    }

    if (session.video.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Not authorized for this upload session" });
    }


    const chunkKey = `raw/${session.videoId}/chunks/part_${chunkIndex}`;

    const chunk = await prisma.uploadChunk.upsert({
      where: {
        sessionId_chunkIndex: {
          sessionId,
          chunkIndex: Number(chunkIndex),
        },
      },
      update: {
        status: "UPLOADED",
        filePath: chunkKey,
        chunkSize: Number(chunkSize) || 0,
        checksum: checksum || null,
        uploadedAt: new Date(),
      },
      create: {
        sessionId,
        chunkIndex: Number(chunkIndex),
        status: "UPLOADED",
        filePath: chunkKey,
        chunkSize: Number(chunkSize) || 0,
        checksum: checksum || null,
      },
    });

    const uploadedCount = await prisma.uploadChunk.count({
      where: { sessionId, status: "UPLOADED" },
    });

    await prisma.uploadSession.update({
      where: { id: sessionId },
      data: {
        uploadedChunks: uploadedCount,
        lastChunkIndex: Number(chunkIndex),
      },
    });

    res.json({
      success: true,
      chunkId: chunk.id,
      uploadedChunks: uploadedCount,
      totalChunks: session.totalChunks,
    });
  } catch (err) {
    console.error("recordChunkUploaded error:", err);
    res.status(500).json({ message: "Failed to record chunk" });
  }
};

module.exports = {
  initChunkSession,
  getChunkUploadUrl,
  recordChunkUploaded,
};
