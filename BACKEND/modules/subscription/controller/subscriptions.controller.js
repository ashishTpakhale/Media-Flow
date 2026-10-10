
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
//send the video id to get the exact video from which the user subscribed
const subscribeChannel = async (req, res) => {
  try {
    const subscriberId = req.user.id;
    const { channelId } = req.params;
    const { videoId } = req.body;

    if (subscriberId === channelId) {
      return res.status(400).json({ message: "Cannot subscribe to yourself" });
    }

    const existing = await prisma.subscription.findUnique({
      where: {
        subscriberId_channelId: {
          subscriberId,
          channelId,
        },
      },
    });

    if (existing) {
      return res.json({ message: "Already subscribed" });
    }

    await prisma.subscription.create({
      data: {
        subscriberId,
        channelId,
        subscribedFromVideoId: videoId || null, 
      },
    });

    res.json({ message: "Subscribed successfully" });

  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const unsubscribeChannel = async (req, res) => {
  try {
    const subscriberId = req.user.id;
    const { channelId } = req.params;

    await prisma.subscription.delete({
      where: {
        subscriberId_channelId: {
          subscriberId,
          channelId,
        },
      },
    });

    res.json({ message: "Unsubscribed successfully" });

  } catch (error) {
    console.error("Unsubscribe error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getSubscribedChannels = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = await prisma.subscription.findMany({
      where: { subscriberId: userId },
      include: {
        channel: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: subscriptions,
    });

  } catch (error) {
    console.error("Fetch subscriptions error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getSubscriberCount = async (req, res) => {
  try {
    const { channelId } = req.params;

    const count = await prisma.subscription.count({
      where: { channelId },
    });

    res.json({ subscribers: count });

  } catch (error) {
    console.error("Subscriber count error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const checkSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { channelId } = req.params;

    const sub = await prisma.subscription.findUnique({
      where: {
        subscriberId_channelId: {
          subscriberId: userId,
          channelId,
        },
      },
    });

    res.json({ subscribed: !!sub });

  } catch (error) {
    console.error("Check subscription error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getSubscribedVideos = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️ Get all subscribed channel IDs
    const subscriptions = await prisma.subscription.findMany({
      where: { subscriberId: userId },
      select: { channelId: true },
    });

    const channelIds = subscriptions.map(s => s.channelId);

    if (!channelIds.length) {
      return res.json({
        success: true,
        videos: [],
      });
    }

    // 2️ Fetch videos from those channels
    const videos = await prisma.video.findMany({
      where: {
        userId: { in: channelIds },
        status: "READY",
        visibility: "PUBLIC",
      },
      orderBy: { createdAt: "desc" },
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

    return res.json({
      success: true,
      videos,
    });

  } catch (error) {
    console.error("Subscribed videos error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = {
  subscribeChannel,
  unsubscribeChannel,
    getSubscribedChannels,
    getSubscriberCount,
    checkSubscription,
    getSubscribedVideos,
};