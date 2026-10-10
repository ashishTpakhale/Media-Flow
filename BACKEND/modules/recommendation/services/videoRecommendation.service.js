const {
  getVideoRecommendations,
} = require("../../../services/videoRecommendation.service");

const getRecommendationsForVideo = async (req, res) => {
  try {
    const { id: videoId } = req.params;

    const recommendations = await getVideoRecommendations(videoId);

    res.json({ recommendations });
  } catch (err) {
    console.error("Video recommendation error:", err);
    res.status(500).json({ message: "Failed to load recommendations" });
  }
};

module.exports = { getRecommendationsForVideo };
  