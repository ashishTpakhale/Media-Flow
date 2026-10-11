const { PrismaClient } = require("@prisma/client");
const {
  DeleteObjectCommand,
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

    // DELETE PROCESSED FILES (HLS)
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.S3_PROCESSED_BUCKET,
        Prefix: `videos/${id}/`,
      })
    );

    if (list.Contents) {
      for (const obj of list.Contents) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.S3_PROCESSED_BUCKET,
            Key: obj.Key,
          })
        ).catch(() => {});
      }
    }

    // DELETE RAW FILE
    if (video.originalFileUrl) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_RAW_BUCKET,
          Key: video.originalFileUrl,
        })
      ).catch(() => {});
    }

    // DELETE DB RECORD
    await prisma.video.delete({
      where: { id },
    });

    res.json({ message: "Video deleted successfully" });
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

module.exports = { deleteVideo };
