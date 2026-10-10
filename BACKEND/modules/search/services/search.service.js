const prisma = require("../../../lib/prisma");
const redis = require("../../../lib/redis");

const MAX_VIDEO_CANDIDATES = 8000;
const MAX_CHANNEL_CANDIDATES = 3000;
const CACHE_TTL = 60;

module.exports = {
  async generateCandidates(parsedQuery, type) {
    const { normalizedQuery, significantTokens } = parsedQuery;

    const cacheKey = `search:candidates:v3:${type}:${normalizedQuery}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const videoSet = new Set();
    const channelSet = new Set();

    /* ---------------- FTS (Phase 1) ---------------- */

    if (type !== "channel") {
      const videos = await prisma.$queryRaw`
        SELECT id
        FROM "Video"
        WHERE
          status = 'READY'
          AND visibility = 'PUBLIC'
          AND "searchVector" @@ plainto_tsquery('english', ${normalizedQuery})
        LIMIT 5000;
      `;
      videos.forEach(v => videoSet.add(v.id));
    }

    if (type !== "video") {
      const channels = await prisma.$queryRaw`
        SELECT id
        FROM "User"
        WHERE
          "searchVector" @@ plainto_tsquery('english', ${normalizedQuery})
        LIMIT 2000;
      `;
      channels.forEach(c => channelSet.add(c.id));
    }

    /* ---------------- Prefix Match ---------------- */

    if (videoSet.size < MAX_VIDEO_CANDIDATES && type !== "channel") {
      const prefixVideos = await prisma.video.findMany({
        where: {
          title: {
            startsWith: significantTokens[0] || "",
            mode: "insensitive"
          },
          status: "READY",
          visibility: "PUBLIC"
        },
        select: { id: true },
        take: 2000
      });
      prefixVideos.forEach(v => videoSet.add(v.id));
    }

    if (channelSet.size < MAX_CHANNEL_CANDIDATES && type !== "video") {
      const prefixChannels = await prisma.user.findMany({
        where: {
          username: {
            startsWith: significantTokens[0] || "",
            mode: "insensitive"
          }
        },
        select: { id: true },
        take: 1000
      });
      prefixChannels.forEach(c => channelSet.add(c.id));
    }

    /* ---------------- Trigram Fuzzy ---------------- */

    if (videoSet.size < MAX_VIDEO_CANDIDATES && type !== "channel") {
      const fuzzyVideos = await prisma.$queryRaw`
        SELECT id
        FROM "Video"
        WHERE
          similarity(title, ${normalizedQuery}) > 0.3
          AND status = 'READY'
          AND visibility = 'PUBLIC'
        ORDER BY similarity(title, ${normalizedQuery}) DESC
        LIMIT 2000;
      `;
      fuzzyVideos.forEach(v => videoSet.add(v.id));
    }

    if (channelSet.size < MAX_CHANNEL_CANDIDATES && type !== "video") {
      const fuzzyChannels = await prisma.$queryRaw`
        SELECT id
        FROM "User"
        WHERE
          similarity(username, ${normalizedQuery}) > 0.3
        ORDER BY similarity(username, ${normalizedQuery}) DESC
        LIMIT 1000;
      `;
      fuzzyChannels.forEach(c => channelSet.add(c.id));
    }

    /* ---------------- Token OR Expansion ---------------- */

    if (significantTokens.length > 1 && type !== "channel") {
      const tokenQuery = significantTokens.join(" | ");
      const tokenVideos = await prisma.$queryRaw`
        SELECT id
        FROM "Video"
        WHERE
          "searchVector" @@ to_tsquery('english', ${tokenQuery})
          AND status = 'READY'
          AND visibility = 'PUBLIC'
        LIMIT 2000;
      `;
      tokenVideos.forEach(v => videoSet.add(v.id));
    }

    /* ---------------- Finalize ---------------- */

    const result = {
      videoCandidates: Array.from(videoSet),
      channelCandidates: Array.from(channelSet)
    };

    await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);
    return result;
  }
};
