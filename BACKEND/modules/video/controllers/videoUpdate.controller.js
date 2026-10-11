const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const {
      title,
      description,
      visibility,
      scheduledAt
    } = req.body;

    const video = await prisma.video.findUnique({
      where: { id }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }

    if (video.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const updatedVideo = await prisma.video.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(visibility !== undefined && { visibility }),
        ...(scheduledAt !== undefined && {
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null
        })
      }
    });

    return res.json({
      success: true,
      message: "Video updated successfully",
      video: updatedVideo
    });

  } catch (error) {
    console.error("Update video error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = { updateVideo };
