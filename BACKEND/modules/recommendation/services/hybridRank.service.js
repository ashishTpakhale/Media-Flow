const redis = require("../../../lib/redis");
const { getTrendingVideos } = require("../../../services/trending.service");
const { getCollaborativeVideos } = require("../../../services/collaborative.service");
const { getPersonalizedVideos } = require("../../feed/services/feed.service");

const CACHE_TTL = 60; // seconds

function score(video, weights) {
  return (
    video.trendingScore * weights.trending +
    video.personalScore * weights.personal +
    video.collabScore * weights.collab
  );
}

const getHybridFeed = async (userId) => {
  const cacheKey = `hybrid:${userId}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const [trending, personal, collab] = await Promise.all([
    getTrendingVideos(),
    getPersonalizedVideos(userId),
    getCollaborativeVideos(userId),
  ]);

  const map = new Map();

  const inject = (videos, type) => {
    videos.forEach((v) => {
      if (!map.has(v.id)) {
        map.set(v.id, {
          ...v,
          trendingScore: 0,
          personalScore: 0,
          collabScore: 0,
        });
      }
      map.get(v.id)[`${type}Score`] += 1;
    });
  };

  inject(trending, "trending");
  inject(personal, "personal");
  inject(collab, "collab");

  const ranked = [...map.values()]
    .map((v) => ({
      ...v,
      finalScore: score(v, {
        trending: 0.4,
        personal: 0.4,
        collab: 0.2,
      }),
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 20);

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(ranked));

  return ranked;
};

module.exports = { getHybridFeed };
