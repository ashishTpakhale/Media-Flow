const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("../../../config/s3");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const updateThumbnail = async (req, res) => {
  try {
    const { videoId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    //  Step 1 — Find existing video
    const existingVideo = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!existingVideo) {
      return res.status(404).json({ message: "Video not found" });
    }

    //  Step 2 — Delete old thumbnail if exists
    if (existingVideo.thumbnailUrl) {
      const oldKey = existingVideo.thumbnailUrl.split(
        `${process.env.S3_PROCESSED_BUCKET}/`
      )[1];

      if (oldKey) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.S3_PROCESSED_BUCKET,
            Key: oldKey,
          })
        );
      }
    }

    // Step 3 — Upload new thumbnail
    const thumbKey = `thumbnails/${videoId}-${Date.now()}.jpg`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_PROCESSED_BUCKET,
        Key: thumbKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

const thumbUrl = `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${process.env.S3_PROCESSED_BUCKET}/${thumbKey}`;
    await prisma.video.update({
      where: { id: videoId },
      data: { thumbnailUrl: thumbUrl },
    });

    res.json({
      message: "Thumbnail replaced successfully",
      thumbnailUrl: thumbUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update thumbnail" });
  }
};

module.exports = { updateThumbnail };
