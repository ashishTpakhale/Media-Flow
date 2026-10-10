const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getVideoRecommendations } = require("../../../services/videoRecommendation.service");

async function getNextAutoplayVideo({ videoId, userId }) {
  // 1️ Current video
  const currentVideo = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, userId: true },
  });

  if (!currentVideo) return null;

  // 2️ Exclude videos user fully watched
  const watched = await prisma.watchHistory.findMany({
    where: {
      userId,
      completed: true,
    },
    select: { videoId: true },
  });

  const watchedIds = watched.map((w) => w.videoId);

  // 3️ Same creator (strong autoplay signal)
  const sameCreatorNext = await prisma.video.findFirst({
    where: {
      userId: currentVideo.userId,
      status: "READY",
      visibility: "PUBLIC",
      NOT: {
        id: { in: [videoId, ...watchedIds] },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true },
      },
    },
  });

  if (sameCreatorNext) {
    return serialize(sameCreatorNext, "same_creator");
  }

  // 4️ Recommendation fallback (Phase 2)
  const recommendations = await getVideoRecommendations(videoId, 5);

  const nextRec = recommendations.find(
    (v) => !watchedIds.includes(v.id)
  );

  if (nextRec) {
    return serialize(nextRec, "recommended");
  }

  // 5️ Trending fallback
  const trending = await prisma.video.findFirst({
    where: {
      status: "READY",
      visibility: "PUBLIC",
      NOT: {
        id: { in: [videoId, ...watchedIds] },
      },
    },
    orderBy: [{ views: "desc" }, { createdAt: "desc" }],
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true },
      },
    },
  });

  if (trending) {
    return serialize(trending, "trending");
  }

  return null;
}

function serialize(video, reason) {
  return {
    ...video,
    views: Number(video.views),
    fileSize: video.fileSize ? Number(video.fileSize) : null,
    autoplayReason: reason,
  };
}

module.exports = { getNextAutoplayVideo };
