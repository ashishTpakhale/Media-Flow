const { PrismaClient } = require("@prisma/client");
const { getTrendingVideos } = require("../services/feed.service");
const { getHybridFeed } = require("../../recommendation/services/hybridRank.service");

const prisma = new PrismaClient();
const PAGE_SIZE = 10;

function serializeVideo(video) {
  return {
    ...video,
    views: Number(video.views),
    fileSize: video.fileSize ? Number(video.fileSize) : null,
  };
}

const getHomeFeed = async (req, res) => {
  try {
    const { cursor } = req.query;

    const videos = await prisma.video.findMany({
      where: {
        status: "READY",
        visibility: "PUBLIC",
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      ...(cursor && {
        cursor: { createdAt: new Date(cursor) },
        skip: 1,
      }),
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    let nextCursor = null;
    if (videos.length > PAGE_SIZE) {
      const nextItem = videos.pop();
      nextCursor = nextItem.createdAt;
    }

    res.json({
      videos: videos.map(serializeVideo),
      nextCursor,
    });
  } catch (err) {
    console.error("Home feed error:", err);
    res.status(500).json({ message: "Failed to load feed" });
  }
};

const getTrendingFeed = async (req, res) => {
  try {
    const videos = await getTrendingVideos();

    res.json({
      videos: videos.map(serializeVideo),
    });
  } catch (err) {
    console.error("Trending feed error:", err);
    res.status(500).json({ message: "Failed to load trending feed" });
  }
};

const getHybridHomeFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const videos = await getHybridFeed(userId);

    res.json({ videos });
  } catch (err) {
    console.error("Hybrid feed error:", err);
    res.status(500).json({ message: "Failed to load hybrid feed" });
  }
};



const deleteHistoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { videoId } = req.params;

    await prisma.watchHistory.delete({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
    });

    return res.json({ message: "History item deleted" });
  } catch (error) {
    console.error("Delete history error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const clearAllHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.watchHistory.deleteMany({
      where: { userId },
    });

    return res.json({ message: "All history cleared" });
  } catch (error) {
    console.error("Clear history error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getWatchHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const historyEntries = await prisma.watchHistory.findMany({
      where: {
        userId,
        video: {
          status: "READY",
          visibility: "PUBLIC",
        },
      },
      orderBy: {
        watchedAt: "desc",
      },
      skip,
      take: limit,
      include: {
        video: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return res.json({
      success: true,
      page,
      limit,
      data: historyEntries,
    });

  } catch (error) {
    console.error("History Feed Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



module.exports = { getHomeFeed, getTrendingFeed ,getHybridHomeFeed,getWatchHistory,deleteHistoryItem,clearAllHistory};
