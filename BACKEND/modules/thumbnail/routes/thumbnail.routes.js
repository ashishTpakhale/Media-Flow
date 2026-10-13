const express = require("express");
const { authMiddleware } = require("../../../middleware/authMiddleware");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const router = express.Router();

const multer = require("multer");
const { updateThumbnail } = require("../controllers/thumbnail.controller");
const upload = multer();

const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("../../../config/s3");

router.put("/thumbnail/:videoId", authMiddleware, upload.single("thumbnail"), updateThumbnail);
router.delete("/thumbnail/:videoId", authMiddleware, async (req, res) => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: req.params.videoId },
    });

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (video.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Not the video owner" });
    }

    if (video.thumbnailUrl) {
      const processedBucket = process.env.S3_PROCESSED_BUCKET || "processed-videos";
      const thumbKey = video.thumbnailUrl.includes(`${processedBucket}/`)
        ? video.thumbnailUrl.split(`${processedBucket}/`)[1]
        : `thumbnails/${video.id}.jpg`;

      if (thumbKey) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: processedBucket,
            Key: thumbKey,
          })
        ).catch((err) => console.error("Error deleting thumbnail from S3:", err.message));
      }
    }

    await prisma.video.update({
      where: { id: req.params.videoId },
      data: { thumbnailUrl: null },
    });

    res.json({ message: "Thumbnail removed successfully" });
  } catch (err) {
    console.error("Delete thumbnail error:", err);
    res.status(500).json({ message: "Failed to remove thumbnail" });
  }
});



module.exports = router;