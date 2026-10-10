  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  async function getRelatedVideos({ videoId, userId, limit = 10 }) {
    /**
     * Step 1: Users who watched this video
     */
    const viewers = await prisma.watchHistory.findMany({
      where: { videoId },
      select: { userId: true },
    });

    const viewerIds = viewers.map(v => v.userId);
    if (viewerIds.length === 0) return [];

    /**
     * Step 2: Videos those users watched (excluding current)
     */
    const related = await prisma.watchHistory.findMany({
      where: {
        userId: { in: viewerIds },
        videoId: { not: videoId },
      },
      select: { videoId: true },
    });

    /**
     * Step 3: Count frequency
     */
    const frequencyMap = {};
    for (const r of related) {
      frequencyMap[r.videoId] = (frequencyMap[r.videoId] || 0) + 1;
    }

    const rankedIds = Object.entries(frequencyMap)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .slice(0, limit);

    /**
     * Step 4: Fetch video details
     */
    const videos = await prisma.video.findMany({
      where: {
        id: { in: rankedIds },
        status: "READY",
        visibility: "PUBLIC",
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return videos;
  }

  module.exports = { getRelatedVideos };
