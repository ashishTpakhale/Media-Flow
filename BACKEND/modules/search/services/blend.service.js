function encodeCursor(cursor) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64");
}

function blendResults(videos = [], channels = [], limit = 20, cursor = null) {
  let videoIndex = cursor?.videoIndex || 0;
  let channelIndex = cursor?.channelIndex || 0;

  const items = [];

  while (items.length < limit) {
    const hasVideo = videoIndex < videos.length;
    const hasChannel = channelIndex < channels.length;

    if (!hasVideo && !hasChannel) break;

    if (hasVideo) {
      items.push({
        type: "video",
        data: videos[videoIndex]
      });
      videoIndex++;
    }

    if (items.length >= limit) break;

    if (hasChannel) {
      items.push({
        type: "channel",
        data: channels[channelIndex]
      });
      channelIndex++;
    }
  }

  const hasMore =
    videoIndex < videos.length || channelIndex < channels.length;

  const nextCursor = hasMore
    ? encodeCursor({ videoIndex, channelIndex })
    : null;

  return {
    results: items,
    nextCursor,
    hasMore
  };
}

module.exports = {
  blendResults
};
