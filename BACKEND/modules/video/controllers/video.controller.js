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

  // construct full public URLs
  const baseUrl = `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public`;
  const serialized = serializeBigInt(video);

  return res.json({
    ...serialized,
    thumbnailUrl: video.thumbnailUrl,  // already full URL from worker
    streamUrl: video.masterPlaylist
      ? `${baseUrl}/${process.env.S3_PROCESSED_BUCKET}/${video.masterPlaylist}`
      : null,
  });
};

const getStreamUrl = async (req, res) => {
  const { id } = req.params;
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
  return res.json({
    streamUrl: `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${process.env.S3_PROCESSED_BUCKET}/${video.masterPlaylist}`,
  });
};

module.exports = {
  getVideoById,
  getStreamUrl,
};
