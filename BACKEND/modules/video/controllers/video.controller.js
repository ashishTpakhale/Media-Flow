const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function serializeBigInt(data) {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

const getVideoById = async (req, res) => {
  const { id } = req.params;
  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });
  if (!video) {
    return res.status(404).json({ message: "Video not found" });
  }
  if (video.visibility !== "PUBLIC") {
    return res.status(403).json({ message: "Video is private" });
  }

  const { getPublicStorageUrl } = require("../../../config/storageUrl");
  const serialized = serializeBigInt(video);

  const processedBucket = process.env.S3_PROCESSED_BUCKET || "processed-videos";
  const finalStreamUrl = video.masterPlaylist
    ? getPublicStorageUrl(processedBucket, video.masterPlaylist)
    : null;
  const finalThumbUrl = getPublicStorageUrl(processedBucket, video.thumbnailUrl);

  return res.json({
    ...serialized,
    thumbnailUrl: finalThumbUrl,
    streamUrl: finalStreamUrl,
  });
};

const getStreamUrl = async (req, res) => {
  const { id } = req.params;
  const { getPublicStorageUrl } = require("../../../config/storageUrl");

  const video = await prisma.video.findUnique({
    where: { id },
    select: {
      status: true,
      masterPlaylist: true,
    },
  });
  if (!video || video.status !== "READY") {
    return res.status(404).json({ message: "Video not ready" });
  }

  const processedBucket = process.env.S3_PROCESSED_BUCKET || "processed-videos";
  return res.json({
    streamUrl: getPublicStorageUrl(processedBucket, video.masterPlaylist),
  });
};

module.exports = {
  getVideoById,
  getStreamUrl,
};
