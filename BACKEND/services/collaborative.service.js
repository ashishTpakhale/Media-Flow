const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Phase 4: Collaborative filtering
 * "Users who watched X also watched Y"
 */
const getCollaborativeVideos = async (userId) => {
  // Videos watched by current user
  const watched = await prisma.watchHistory.findMany({
    where: { userId },
    select: { videoId: true },
  });

  if (watched.length === 0) return [];

  const watchedIds = watched.map((w) => w.videoId);

  // Find other users who watched same videos
  const similarUsers = await prisma.watchHistory.findMany({
    where: {
      videoId: { in: watchedIds },
      userId: { not: userId },
    },
    select: { userId: true },
  });

  const userIds = [...new Set(similarUsers.map((u) => u.userId))];
  if (userIds.length === 0) return [];

  // Videos those users watched (excluding already watched)
  const videos = await prisma.video.findMany({
    where: {
      status: "READY",
      visibility: "PUBLIC",
      watchHistory: {
        some: {
          userId: { in: userIds },
        },
      },
      NOT: {
        id: { in: watchedIds },
      },
    },
    take: 50,
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

  return videos.map((v) => ({
    ...v,
    views: Number(v.views),
    fileSize: v.fileSize ? Number(v.fileSize) : null,
  }));
};

module.exports = { getCollaborativeVideos };
