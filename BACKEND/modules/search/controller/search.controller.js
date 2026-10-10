const searchService = require("../services/search.service");
const rankingService = require("../services/ranking.service");
const personalizationService = require("../services/personalization.service");
const blendService = require("../services/blend.service");

const queryParser = require("../../../queryParser");
const prisma = require("../../../lib/prisma");
const redis = require("../../../lib/redis");

/* ------------------ USER CONTEXT BUILDER ------------------ */
async function buildUserContext(userId) {
  if (!userId) {
    return {
      watchedVideoIds: new Set(),
      completedVideoIds: new Set(),
      recentChannelIds: new Set(),
      subscribedChannelIds: new Set()
    };
  }

  const history = await prisma.watchHistory.findMany({
    where: { userId },
    take: 100,
    orderBy: { watchedAt: "desc" },
    include: { video: true }
  });

  const subscriptions = await prisma.subscription.findMany({
    where: { subscriberId: userId }
  });

  return {
    watchedVideoIds: new Set(history.map(h => h.videoId)),
    completedVideoIds: new Set(
      history.filter(h => h.completed).map(h => h.videoId)
    ),
    recentChannelIds: new Set(history.map(h => h.video.userId)),
    subscribedChannelIds: new Set(
      subscriptions.map(s => s.channelId)
    )
  };
}

/* ------------------ CONTROLLER ------------------ */
module.exports = {
  async search(req, res) {
    try {
      /* ---------- Input ---------- */
      const rawQuery = (req.query.q || "").trim();
      const type = req.query.type || "all";
      const limit = Math.min(Number(req.query.limit) || 20, 50);

      if (!rawQuery) {
        return res.status(400).json({ error: "Query required" });
      }

      /* ---------- Phase 2: Parse Query ---------- */
      const parsedQuery = queryParser.parse(rawQuery);

      /* ---------- Phase 3: Candidate Generation ---------- */
      const {
        videoCandidates,
        channelCandidates
      } = await searchService.generateCandidates(parsedQuery, type);

      /* ---------- Phase 4: Fetch Full Data with Relations ---------- */
      let videos = [];
      let channels = [];

      if (videoCandidates.length && type !== "channel") {
        videos = await prisma.video.findMany({
          where: { id: { in: videoCandidates } },
          select: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            duration: true,
            views: true,
            createdAt: true,
            userId: true,
            //  Include channel/user information
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                isVerified: true
              }
            }
          }
        });
      }

      if (channelCandidates.length && type !== "video") {
        channels = await prisma.user.findMany({
          where: { id: { in: channelCandidates } },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            isVerified: true,
            createdAt: true,
            //  Include counts
            _count: {
              select: {
                subscribers: true,
                videos: true
              }
            }
          }
        });
      }

      /* ---------- Phase 5: Ranking ---------- */
      const rankedVideos =
        type !== "channel"
          ? rankingService.rankVideos(videos, parsedQuery)
          : [];

      const rankedChannels =
        type !== "video"
          ? rankingService.rankChannels(channels)
          : [];

      /* ---------- Phase 6: Personalization ---------- */
      const userContext = await buildUserContext(req.user?.id);

      const personalizedVideos =
        type !== "channel"
          ? personalizationService.personalizeVideos(
              rankedVideos,
              userContext
            )
          : [];

      const personalizedChannels =
        type !== "video"
          ? personalizationService.personalizeChannels(
              rankedChannels,
              userContext
            )
          : [];

      /* ---------- Phase 7: Transform Data for Frontend ---------- */
      const transformedVideos = personalizedVideos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        views: video.views,
        createdAt: video.createdAt,
        userId: video.userId,
        // Transform user to channel format expected by frontend
        channel: {
          id: video.user.id,
          username: video.user.username,
          displayName: video.user.displayName,
          avatarUrl: video.user.avatarUrl,
          verified: video.user.isVerified
        },
        score: video.score // Preserve ranking score if it exists
      }));

      const transformedChannels = personalizedChannels.map(channel => ({
        id: channel.id,
        username: channel.username,
        displayName: channel.displayName,
        avatarUrl: channel.avatarUrl,
        description: channel.bio,
        verified: channel.isVerified,
        createdAt: channel.createdAt,
        subscriberCount: channel._count?.subscribers || 0,
        videoCount: channel._count?.videos || 0,
        score: channel.score // Preserve ranking score if it exists
      }));

      /* ---------- Phase 8: Safety Trim (IMPORTANT) ---------- */
      const MAX_POOL = limit * 5;
      const safeVideos = transformedVideos.slice(0, MAX_POOL);
      const safeChannels = transformedChannels.slice(0, MAX_POOL);

      /* ---------- Phase 9: Cursor Parsing ---------- */
      let cursor = null;
      if (req.query.cursor) {
        try {
          cursor = JSON.parse(
            Buffer.from(req.query.cursor, "base64").toString()
          );
        } catch {
          cursor = null;
        }
      }

      /* ---------- Phase 10: Blending & Pagination ---------- */
      const blended = blendService.blendResults(
        safeVideos,
        safeChannels,
        limit,
        cursor
      );

      /* ---------- Phase 11: Store Search Context ---------- */
      if (req.user?.id && !req.query.cursor) {
        await redis.set(
          `search:context:${req.user.id}`,
          JSON.stringify({
            query: parsedQuery.normalizedQuery,
            tokens: parsedQuery.significantTokens,
            intent: parsedQuery.intent,
            timestamp: Date.now()
          }),
          "EX",
          600 // 10 minutes
        );
      }

      /* ---------- Response ---------- */
      return res.json({
        query: parsedQuery.normalizedQuery,
        intent: parsedQuery.intent,
        ...blended
      });
    } catch (err) {
      console.error("Search failed:", err);
      return res.status(500).json({ error: "Search failed" });
    }
  }
};