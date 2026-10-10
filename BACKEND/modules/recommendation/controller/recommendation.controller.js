const { getRelatedVideos } = require("../services/recommendation.service");

function serializeVideo(video) {
  return {
    ...video,
    views: Number(video.views),
    fileSize: video.fileSize ? Number(video.fileSize) : null,
  };
}

const getRelated = async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const userId = req.user?.id;

    const videos = await getRelatedVideos({ videoId, userId });

    res.json({
      videos: videos.map(serializeVideo),
    });
  } catch (err) {
    console.error("Related videos error:", err);
    res.status(500).json({ message: "Failed to load recommendations" });
  }
};

module.exports = { getRelated };
