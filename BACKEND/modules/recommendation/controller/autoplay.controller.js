const { getNextAutoplayVideo } = require("../../../services/videoRecommendation.service");

const getAutoplayNext = async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const userId = req.user.id;

    const nextVideo = await getNextAutoplayVideo({
      videoId,
      userId,
    });

    if (!nextVideo) {
      return res.json({ next: null });
    }

    res.json({ next: nextVideo });
  } catch (err) {
    console.error("Autoplay error:", err);
    res.status(500).json({ message: "Autoplay failed" });
  }
};

module.exports = { getAutoplayNext };