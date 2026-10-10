const DAY = 24 * 60 * 60 * 1000;

function normalize(value, max = 1) {
  if (!value || value <= 0) return 0;
  return Math.min(value / max, 1);
}

function freshnessScore(date) {
  const ageDays = (Date.now() - new Date(date).getTime()) / DAY;
  return Math.exp(-ageDays / 30); // ~30-day decay
}

function rankVideos(videos, queryContext) {
  return videos.map(video => {
    const textScore = normalize(video._textScore || 1);
    const engagementScore = normalize(video.views, 1_000_000);
    const freshScore = freshnessScore(video.createdAt);
    const intentBoost = queryContext.intent.video || 0.5;

    const score =
      textScore * 0.4 +
      engagementScore * 0.25 +
      freshScore * 0.2 +
      intentBoost * 0.15;

    return { ...video, score };
  }).sort((a, b) => b.score - a.score);
}

function rankChannels(channels) {
  return channels.map(channel => {
    const textScore = normalize(channel._textScore || 1);
    const authorityScore = normalize(channel.subscribers || 1000);
    const activityScore = freshnessScore(channel.createdAt);

    const score =
      textScore * 0.5 +
      authorityScore * 0.3 +
      activityScore * 0.2;

    return { ...channel, score };
  }).sort((a, b) => b.score - a.score);
}

module.exports = {
  rankVideos,
  rankChannels
};
