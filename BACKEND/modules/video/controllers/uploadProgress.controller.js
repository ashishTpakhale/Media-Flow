const { PrismaClient } = require("@prisma/client");
const { emitVideoUpdate } = require("../../../websocket");

const prisma = new PrismaClient();

const updateUploadProgress = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { progress } = req.body;
    const userId = req.user.id;

    if (progress < 0 || progress > 100) {
      return res.status(400).json({ message: "Invalid progress value" });
    }

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { userId: true, status: true },
    });

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (video.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (video.status !== "UPLOADING") {
      return res.json({ message: "Upload already completed" });
    }

    await prisma.video.update({
      where: { id: videoId },
      data: { uploadProgress: Math.floor(progress) },
    });

    // Emit real-time progress update
    emitVideoUpdate(userId, videoId, {
      uploadProgress: Math.floor(progress),
      status: "UPLOADING",
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Progress update error:", err);
    res.status(500).json({ message: "Progress update failed" });
  }
};

module.exports = { updateUploadProgress };
