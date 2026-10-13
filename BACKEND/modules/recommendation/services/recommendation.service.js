const { PrismaClient } = require("@prisma/client");
const redis = require("../../../lib/redis");
const prisma = new PrismaClient();

const CACHE_TTL = 600; // 10 minutes

async function getRelatedVideos({ videoId, userId, limit = 10 }) {
  const cacheKey = `recommendations:related:${videoId}:${limit}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {}

  /**
   * Step 1: Recent viewers of this video (sample most recent 100 to avoid unbounded scans)
   */
  const viewers = await prisma.watchHistory.findMany({
    where: { videoId },
    select: { userId: true },
    orderBy: { watchedAt: "desc" },
    take: 100,
  });

  const viewerIds = viewers.map(v => v.userId).filter(id => id !== userId);
  let rankedIds = [];

  if (viewerIds.length > 0) {
    /**
     * Step 2: Sample videos those users watched (excluding current video)
     */
    const related = await prisma.watchHistory.findMany({
      where: {
        userId: { in: viewerIds },
        videoId: { not: videoId },
      },
      select: { videoId: true },
      take: 500,
    });

    /**
     * Step 3: Count frequency
     */
    const frequencyMap = {};
    for (const r of related) {
      frequencyMap[r.videoId] = (frequencyMap[r.videoId] || 0) + 1;
    }

    rankedIds = Object.entries(frequencyMap)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .slice(0, limit);
  }

  /**
   * Step 4: Fetch video details (with fallback to recent popular videos if co-watch data is small)
   */
  let videos = [];
  if (rankedIds.length > 0) {
    videos = await prisma.video.findMany({
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
  }

  // If not enough related videos found, backfill with popular public videos
  if (videos.length < limit) {
    const existingIds = new Set([videoId, ...videos.map(v => v.id)]);
    const fallback = await prisma.video.findMany({
      where: {
        id: { notIn: Array.from(existingIds) },
        status: "READY",
        visibility: "PUBLIC",
      },
      orderBy: [{ views: "desc" }, { createdAt: "desc" }],
      take: limit - videos.length,
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });
    videos = [...videos, ...fallback];
  }

  const { getPublicStorageUrl } = require("../../../config/storageUrl");
  const processedBucket = process.env.S3_PROCESSED_BUCKET || "processed-videos";

  const result = videos.map(v => ({
    ...v,
    thumbnailUrl: getPublicStorageUrl(processedBucket, v.thumbnailUrl),
    views: Number(v.views),
    fileSize: v.fileSize ? Number(v.fileSize) : null,
  }));

  try {
    await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);
  } catch (err) {}

  return result;
}

module.exports = { getRelatedVideos };
