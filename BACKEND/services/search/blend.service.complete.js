// services/search/blend.service.js
// Complete blend service that returns proper format for frontend

/**
 * Blends videos and channels into a single paginated result
 * @param {Array} videos - Array of video objects
 * @param {Array} channels - Array of channel objects  
 * @param {Number} limit - Number of results per page
 * @param {Object} cursor - Pagination cursor object
 * @returns {Object} - {items: [], nextCursor: string|null}
 */
function blendResults(videos, channels, limit = 20, cursor = null) {
  try {
    // Default to empty arrays if undefined
    videos = videos || [];
    channels = channels || [];

    // Determine starting positions from cursor
    let videoIndex = cursor?.videoIndex || 0;
    let channelIndex = cursor?.channelIndex || 0;

    const items = [];
    let videoCount = 0;
    let channelCount = 0;

    // Blending strategy: 3 videos, then 1 channel (like YouTube)
    const VIDEO_BATCH = 3;
    const CHANNEL_BATCH = 1;

    while (items.length < limit) {
      // Add a batch of videos
      for (let i = 0; i < VIDEO_BATCH && items.length < limit; i++) {
        if (videoIndex < videos.length) {
          items.push({
            type: "video",
            ...videos[videoIndex]
          });
          videoIndex++;
          videoCount++;
        }
      }

      // Add a batch of channels
      for (let i = 0; i < CHANNEL_BATCH && items.length < limit; i++) {
        if (channelIndex < channels.length) {
          items.push({
            type: "channel",
            ...channels[channelIndex]
          });
          channelIndex++;
          channelCount++;
        }
      }

      // Break if both arrays are exhausted
      if (videoIndex >= videos.length && channelIndex >= channels.length) {
        break;
      }
    }

    // Generate next cursor if there are more results
    let nextCursor = null;
    const hasMoreVideos = videoIndex < videos.length;
    const hasMoreChannels = channelIndex < channels.length;

    if (hasMoreVideos || hasMoreChannels) {
      const cursorData = {
        videoIndex,
        channelIndex
      };
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString("base64");
    }

    // Return in format frontend expects
    return {
      items,
      nextCursor,
      stats: {
        total: items.length,
        videos: videoCount,
        channels: channelCount,
        hasMore: hasMoreVideos || hasMoreChannels
      }
    };

  } catch (error) {
    console.error("Blend service error:", error);
    // Return safe empty response
    return {
      items: [],
      nextCursor: null,
      stats: {
        total: 0,
        videos: 0,
        channels: 0,
        hasMore: false
      }
    };
  }
}

// Export the function
module.exports = {
  blendResults
};