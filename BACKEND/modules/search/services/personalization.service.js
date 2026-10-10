function personalizeVideos(videos, userContext) {
  const {
    watchedVideoIds,
    completedVideoIds,
    recentChannelIds
  } = userContext;

  return videos.map(video => {
    let multiplier = 1;

    // Already watched → demote
    if (watchedVideoIds.has(video.id)) {
      multiplier *= 0.7;
    }

    // User completes videos from this channel
    if (recentChannelIds.has(video.userId)) {
      multiplier *= 1.15;
    }

    // High-quality signal
    if (completedVideoIds.has(video.id)) {
      multiplier *= 1.1;
    }

    return {
      ...video,
      score: video.score * multiplier
    };
  }).sort((a, b) => b.score - a.score);
}

function personalizeChannels(channels, userContext) {
  const { subscribedChannelIds, recentChannelIds } = userContext;

  return channels.map(channel => {
    let multiplier = 1;

    if (subscribedChannelIds.has(channel.id)) {
      multiplier *= 1.3;
    }

    if (recentChannelIds.has(channel.id)) {
      multiplier *= 1.15;
    }

    return {
      ...channel,
      score: channel.score * multiplier
    };
  }).sort((a, b) => b.score - a.score);
}

module.exports = {
  personalizeVideos,
  personalizeChannels
};
