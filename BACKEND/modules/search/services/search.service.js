const prisma = require("../../../lib/prisma");
const redis = require("../../../lib/redis");

const MAX_VIDEO_CANDIDATES = 8000;
const MAX_CHANNEL_CANDIDATES = 3000;
const CACHE_TTL = 60;

module.exports = {
  async generateCandidates(parsedQuery, type) {
    const { normalizedQuery, significantTokens } = parsedQuery;

    const cacheKey = `search:candidates:v4:${type}:${normalizedQuery}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (cacheErr) {
      // Continue if Redis is unavailable
    }

    const videoScores = new Map(); // id -> score (0.0 to 1.0)
    const channelScores = new Map(); // id -> score (0.0 to 1.0)

    const recordVideoScore = (id, score) => {
      const current = videoScores.get(id) || 0;
      videoScores.set(id, Math.max(current, Math.min(Number(score) || 0.5, 1.0)));
    };

    const recordChannelScore = (id, score) => {
      const current = channelScores.get(id) || 0;
      channelScores.set(id, Math.max(current, Math.min(Number(score) || 0.5, 1.0)));
    };

    /* ---------------- FTS (Phase 1) ---------------- */

    if (type !== "channel") {
      try {
        const videos = await prisma.$queryRaw`
          SELECT id, 
                 ts_rank("searchVector", plainto_tsquery('english', ${normalizedQuery})) as rank
          FROM "Video"
          WHERE
            status = 'READY'
            AND visibility = 'PUBLIC'
            AND (
              "searchVector" @@ plainto_tsquery('english', ${normalizedQuery})
              OR title ILIKE ${'%' + normalizedQuery + '%'}
            )
          ORDER BY rank DESC NULLS LAST
          LIMIT 5000;
        `;
        videos.forEach(v => recordVideoScore(v.id, v.rank ? Math.min(v.rank * 2, 1.0) : 0.7));
      } catch (ftsErr) {
        // Fallback to title search if tsvector expression fails
        const fallbackVideos = await prisma.video.findMany({
          where: {
            title: { contains: normalizedQuery, mode: "insensitive" },
            status: "READY",
            visibility: "PUBLIC",
          },
          select: { id: true },
          take: 2000,
        });
        fallbackVideos.forEach(v => recordVideoScore(v.id, 0.6));
      }
    }

    if (type !== "video") {
      try {
        const channels = await prisma.$queryRaw`
          SELECT id,
                 ts_rank("searchVector", plainto_tsquery('english', ${normalizedQuery})) as rank
          FROM "User"
          WHERE
            "searchVector" @@ plainto_tsquery('english', ${normalizedQuery})
            OR username ILIKE ${'%' + normalizedQuery + '%'}
            OR "displayName" ILIKE ${'%' + normalizedQuery + '%'}
          ORDER BY rank DESC NULLS LAST
          LIMIT 2000;
        `;
        channels.forEach(c => recordChannelScore(c.id, c.rank ? Math.min(c.rank * 2, 1.0) : 0.7));
      } catch (ftsErr) {
        const fallbackChannels = await prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: normalizedQuery, mode: "insensitive" } },
              { displayName: { contains: normalizedQuery, mode: "insensitive" } },
            ],
          },
          select: { id: true },
          take: 1000,
        });
        fallbackChannels.forEach(c => recordChannelScore(c.id, 0.6));
      }
    }

    /* ---------------- Prefix Match ---------------- */

    if (videoScores.size < MAX_VIDEO_CANDIDATES && type !== "channel") {
      const prefixVideos = await prisma.video.findMany({
        where: {
          title: {
            startsWith: significantTokens[0] || normalizedQuery,
            mode: "insensitive",
          },
          status: "READY",
          visibility: "PUBLIC",
        },
        select: { id: true },
        take: 2000,
      });
      prefixVideos.forEach(v => recordVideoScore(v.id, 0.65));
    }

    if (channelScores.size < MAX_CHANNEL_CANDIDATES && type !== "video") {
      const prefixChannels = await prisma.user.findMany({
        where: {
          username: {
            startsWith: significantTokens[0] || normalizedQuery,
            mode: "insensitive",
          },
        },
        select: { id: true },
        take: 1000,
      });
      prefixChannels.forEach(c => recordChannelScore(c.id, 0.65));
    }

    /* ---------------- Trigram Fuzzy ---------------- */

    if (videoScores.size < MAX_VIDEO_CANDIDATES && type !== "channel") {
      try {
        const fuzzyVideos = await prisma.$queryRaw`
          SELECT id, similarity(title, ${normalizedQuery}) as sim
          FROM "Video"
          WHERE
            similarity(title, ${normalizedQuery}) > 0.3
            AND status = 'READY'
            AND visibility = 'PUBLIC'
          ORDER BY sim DESC
          LIMIT 2000;
        `;
        fuzzyVideos.forEach(v => recordVideoScore(v.id, v.sim || 0.5));
      } catch (fuzzyErr) {
        // Trigram extension may not be active; skip silently
      }
    }

    if (channelScores.size < MAX_CHANNEL_CANDIDATES && type !== "video") {
      try {
        const fuzzyChannels = await prisma.$queryRaw`
          SELECT id, similarity(username, ${normalizedQuery}) as sim
          FROM "User"
          WHERE
            similarity(username, ${normalizedQuery}) > 0.3
          ORDER BY sim DESC
          LIMIT 1000;
        `;
        fuzzyChannels.forEach(c => recordChannelScore(c.id, c.sim || 0.5));
      } catch (fuzzyErr) {
        // Skip
      }
    }

    /* ---------------- Token OR Expansion ---------------- */

    if (significantTokens.length > 1 && type !== "channel") {
      try {
        const cleanTokens = significantTokens
          .map((t) => t.replace(/[^a-zA-Z0-9]/g, "").trim())
          .filter(Boolean);

        if (cleanTokens.length > 1) {
          const tokenQuery = cleanTokens.join(" | ");
          const tokenVideos = await prisma.$queryRaw`
            SELECT id, ts_rank("searchVector", to_tsquery('english', ${tokenQuery})) as rank
            FROM "Video"
            WHERE
              "searchVector" @@ to_tsquery('english', ${tokenQuery})
              AND status = 'READY'
              AND visibility = 'PUBLIC'
            LIMIT 2000;
          `;
          tokenVideos.forEach(v => recordVideoScore(v.id, v.rank ? Math.min(v.rank, 0.6) : 0.4));
        }
      } catch (tokenErr) {
        // Skip
      }
    }


    /* ---------------- Finalize ---------------- */

    const videoTextScores = Object.fromEntries(videoScores);
    const channelTextScores = Object.fromEntries(channelScores);

    const result = {
      videoCandidates: Array.from(videoScores.keys()),
      videoTextScores,
      channelCandidates: Array.from(channelScores.keys()),
      channelTextScores,
    };

    try {
      await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);
    } catch (redisSetErr) {}

    return result;
  },
};
