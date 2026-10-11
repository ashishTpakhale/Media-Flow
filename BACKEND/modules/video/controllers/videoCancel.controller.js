const { PrismaClient } = require("@prisma/client");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { videoQueue } = require("../../../queues/videoQueue");
const { s3 } = require("../../../config/s3"); 

const prisma = new PrismaClient();

const cancelVideo = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const video = await prisma.video.findUnique({ where: { id } });

  if (!video || video.userId !== userId) {
    return res.status(404).json({ message: "Video not found" });
  }

  if (!["UPLOADING", "PROCESSING"].includes(video.status)) {
    return res.status(400).json({ message: "Cannot cancel video now" });
  }

  // Remove queue job if exists
  await videoQueue.remove(id).catch(() => {});

  // Delete raw file
  if (video.originalFileUrl) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_RAW_BUCKET,
        Key: video.originalFileUrl,
      })
    ).catch(() => {});
  }

  await prisma.video.update({
    where: { id },
    data: { status: "FAILED", visibility: "PRIVATE" },
  });

  res.json({ message: "Video cancelled" });
};

module.exports = { cancelVideo };
