const { PrismaClient } = require("@prisma/client");
const redis = require("../../../lib/redis");
const { getPublicStorageUrl } = require("../../../config/storageUrl");
const prisma = new PrismaClient();

const TRENDING_CACHE_TTL = 300; // 5 minutes

async function getTrendingVideos(limit = 20) {
  const cacheKey = `feed:trending:global:${limit}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {}

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h

  // Fetch top candidates instead of unconstrained full table scan
  const candidates = await prisma.video.findMany({
    where: {
      status: "READY",
      visibility: "PUBLIC",
    },
    take: 100,
    orderBy: [
      { views: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true },
      },
      _count: {
        select: {
          watchHistory: {
            where: {
              watchedAt: { gte: since },
            },
          },
        },
      },
      watchHistory: {
        where: {
          watchedAt: { gte: since },
          completed: true,
        },
        select: {
          completed: true,
        },
      },
    },
  });

  const scored = candidates.map((video) => {
    const recentViews = video._count?.watchHistory || 0;
    const recentCompletions = video.watchHistory ? video.watchHistory.length : 0;

    const ageInHours =
      (Date.now() - new Date(video.createdAt).getTime()) / 36e5;

    const score =
      recentViews * 3 +
      recentCompletions * 5 -
      ageInHours * 0.5;

    const { watchHistory, _count, ...cleanVideo } = video;

    return {
      ...cleanVideo,
      views: Number(cleanVideo.views),
      fileSize: cleanVideo.fileSize ? Number(cleanVideo.fileSize) : null,
      trendingScore: Number(score.toFixed(2)),
    };
  });

  const result = scored
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit);

  try {
    await redis.set(cacheKey, JSON.stringify(result), "EX", TRENDING_CACHE_TTL);
  } catch (err) {}

  return result;
}
async function getPersonalizedVideos(userId, limit = 20) {
  const processedBucket = process.env.S3_PROCESSED_BUCKET || "processed-videos";

  // Get recent videos the user already watched (bounded to last 200)
  const history = await prisma.watchHistory.findMany({
    where: { userId },
    select: { videoId: true },
    orderBy: { watchedAt: "desc" },
    take: 200,
  });

  const watchedIds = history.map((h) => h.videoId);

  const videos = await prisma.video.findMany({
    where: {
      status: "READY",
      visibility: "PUBLIC",
      // Do not show recently watched videos
      id: { notIn: watchedIds },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
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
    thumbnailUrl: getPublicStorageUrl(processedBucket, v.thumbnailUrl),
    views: Number(v.views),
    fileSize: v.fileSize ? Number(v.fileSize) : null,
  }));
}



module.exports = { getTrendingVideos,getPersonalizedVideos };
