const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getVideoRecommendations(videoId, limit = 10) {
  // 1️ Get current video
  const currentVideo = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, userId: true },
  });

  if (!currentVideo) return [];

  const results = new Map();

  const addVideos = (videos, reason) => {
    videos.forEach((v) => {
      if (!results.has(v.id)) {
        results.set(v.id, {
          ...v,
          reason,
        });
      }
    });
  };

  // 2️ Same creator videos
  const sameCreator = await prisma.video.findMany({
    where: {
      userId: currentVideo.userId,
      status: "READY",
      visibility: "PUBLIC",
      NOT: { id: videoId },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true },
      },
    },
  });

  addVideos(sameCreator, "same_creator");

  // 3️ Collaborative filtering
  const watchedByUsers = await prisma.watchHistory.findMany({
    where: { videoId },
    select: { userId: true },
  });

  const userIds = [...new Set(watchedByUsers.map((w) => w.userId))];

  if (userIds.length > 0) {
    const collaborative = await prisma.video.findMany({
      where: {
        status: "READY",
        visibility: "PUBLIC",
        watchHistory: {
          some: {
            userId: { in: userIds },
          },
        },
        NOT: { id: videoId },
      },
      take: limit,
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    addVideos(collaborative, "collaborative");
  }

  // 4️ Trending fallback
  const trending = await prisma.video.findMany({
    where: {
      status: "READY",
      visibility: "PUBLIC",
      NOT: { id: videoId },
    },
    orderBy: [
      { views: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true },
      },
    },
  });

  addVideos(trending, "trending");

  // 5️ Final list
  return [...results.values()]
    .slice(0, limit)
    .map((v) => ({
      ...v,
      views: Number(v.views),
      fileSize: v.fileSize ? Number(v.fileSize) : null,
    }));
}

module.exports = { getVideoRecommendations };
