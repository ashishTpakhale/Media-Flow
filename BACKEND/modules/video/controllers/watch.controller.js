const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Records watch progress & completion
 */
const recordView = async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const userId = req.user.id;
    const { watchDuration, completed } = req.body;

    if (!watchDuration || watchDuration < 1) {
      return res.status(400).json({ message: "Invalid watch duration" });
    }

    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video || video.status !== "READY") {
      return res.status(404).json({ message: "Video not available" });
    }

    const alreadyCompleted = await prisma.watchHistory.findFirst({
      where: {
        userId,
        videoId,
        completed: true,
      },
    });

    await prisma.$transaction(async (tx) => {
      if (completed && !alreadyCompleted) {
        await tx.video.update({
          where: { id: videoId },
          data: { views: { increment: 1 } },
        });
      }

      await tx.watchHistory.create({
        data: {
          userId,
          videoId,
          watchDuration,
          completed: completed ?? false,
        },
      });
    });

    res.json({
      message: completed
        ? "View recorded (completed)"
        : "Watch progress recorded",
    });
  } catch (err) {
    console.error("recordView error:", err);
    res.status(500).json({ message: "Failed to record watch" });
  }
};

module.exports = { recordView };
