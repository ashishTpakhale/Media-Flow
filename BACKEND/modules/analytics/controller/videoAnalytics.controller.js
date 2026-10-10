// controllers/videoAnalytics.controller.js
const prisma = require("../../../prisma/client"); 

exports.getSingleVideoAnalytics = async (req, res) => {
  try {
    const { videoId } = req.params
    const channelId = req.user.id

    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        userId: channelId
      },
      select: {
        id: true,
        title: true,
        views: true
      }
    })

    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" })
    }

    const watchStats = await prisma.watchHistory.aggregate({
      where: { videoId },
      _sum: { watchDuration: true }
    })

    const watchTimeSeconds = watchStats._sum.watchDuration || 0

    //   YouTube-style attribution
    const subscribersGained = await prisma.subscription.count({
      where: {
        channelId,
        subscribedFromVideoId: videoId
      }
    })

    const likes = await prisma.like.count({ where: { videoId } })
    const comments = await prisma.comment.count({ where: { videoId } })

    return res.json({
      success: true,
      videoId: video.id,
      title: video.title,
      views: video.views,
      watchTimeSeconds,
      watchTimeMinutes: +(watchTimeSeconds / 60).toFixed(2),
      watchTimeHours: +(watchTimeSeconds / 3600).toFixed(2),
      subscribersGained,
      likes,
      comments
    })
  } catch (err) {
    console.error("Video analytics error:", err)
    res.status(500).json({ success: false, message: "Failed to fetch video analytics" })
  }
}

