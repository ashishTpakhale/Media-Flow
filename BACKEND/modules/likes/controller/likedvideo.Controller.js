const { PrismaClient } = require("@prisma/client");
const { get } = require("mongoose");
const prisma = new PrismaClient();

const likeVideo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { videoId } = req.params;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
    });

    if (existingLike) {
      return res.json({ message: "Already liked" });
    }

    await prisma.like.create({
      data: {
        userId,
        videoId,
      },
    });

    return res.json({ message: "Video liked" });

  } catch (error) {
    console.error("Like error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



const unlikeVideo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { videoId } = req.params;

    await prisma.like.delete({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
    });

    return res.json({ message: "Video unliked" });

  } catch (error) {
    console.error("Unlike error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const likedvideos = async (req, res) => {
  try {
    const userId = req.user.id;

    const likes = await prisma.like.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
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

    const filteredLikes = likes.filter(
      l => l.video?.status === "READY" && l.video?.visibility === "PUBLIC"
    );

    return res.json({
      success: true,
      data: filteredLikes,
    });

  } catch (error) {
    console.error("Liked videos error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const getVideoLikes = async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const userId = req.user?.id || null; 

    // Total likes
    const totalLikes = await prisma.like.count({
      where: { videoId },
    });

    let likedByUser = false;

    if (userId) {
      const like = await prisma.like.findUnique({
        where: {
          userId_videoId: {
            userId,
            videoId,
          },
        },
      });

      likedByUser = !!like;
    }

    return res.json({
      success: true,
      totalLikes,
      likedByUser,
    });

  } catch (error) {
    console.error("Get likes error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = { likeVideo, unlikeVideo, likedvideos,getVideoLikes };