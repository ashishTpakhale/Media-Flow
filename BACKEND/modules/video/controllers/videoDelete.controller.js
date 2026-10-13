const { PrismaClient } = require("@prisma/client");
const {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { s3 } = require("../../../config/s3");

const prisma = new PrismaClient();

const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const video = await prisma.video.findUnique({ where: { id } });

    if (!video || video.userId !== userId) {
      return res.status(404).json({ message: "Video not found" });
    }

    // 1. DELETE PROCESSED FILES (HLS) - Fully paginated with batch deletion
    let isTruncated = true;
    let continuationToken = undefined;

    while (isTruncated) {
      const listResponse = await s3.send(
        new ListObjectsV2Command({
          Bucket: process.env.S3_PROCESSED_BUCKET,
          Prefix: `videos/${id}/`,
          ContinuationToken: continuationToken,
        })
      );

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        const objectsToDelete = listResponse.Contents.map((obj) => ({ Key: obj.Key }));
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: process.env.S3_PROCESSED_BUCKET,
            Delete: {
              Objects: objectsToDelete,
              Quiet: true,
            },
          })
        ).catch((err) => console.error("Error batch deleting processed video files:", err));
      }

      isTruncated = !!listResponse.IsTruncated;
      continuationToken = listResponse.NextContinuationToken;
    }

    // 2. DELETE THUMBNAIL IF PRESENT
    if (video.thumbnailUrl) {
      // Keys are typically `thumbnails/${id}.jpg` or `thumbnails/${id}-timestamp.jpg`
      let thumbKey = null;
      if (video.thumbnailUrl.includes(`${process.env.S3_PROCESSED_BUCKET}/`)) {
        thumbKey = video.thumbnailUrl.split(`${process.env.S3_PROCESSED_BUCKET}/`)[1];
      } else {
        thumbKey = `thumbnails/${id}.jpg`;
      }

      if (thumbKey) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.S3_PROCESSED_BUCKET,
            Key: thumbKey,
          })
        ).catch((err) => console.error("Error deleting thumbnail:", err.message));
      }
    }

    // 3. DELETE RAW FILE
    if (video.originalFileUrl) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_RAW_BUCKET,
          Key: video.originalFileUrl,
        })
      ).catch((err) => console.error("Error deleting raw file:", err.message));
    }

    // 4. DELETE DB RECORD (cascades uploadSession, qualities, comments, likes)
    await prisma.video.delete({
      where: { id },
    });

    res.json({ message: "Video and all associated assets deleted successfully" });
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

module.exports = { deleteVideo };
