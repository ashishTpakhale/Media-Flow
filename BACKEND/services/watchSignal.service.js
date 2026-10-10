const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Converts raw watch data into weighted interest signals
 */
async function processWatchSignal({
  userId,
  videoId,
  watchDuration,
  completed,
}) {
  // Strong signal for completion
  let score = 0;

  if (completed) score += 5;
  if (watchDuration > 30) score += 2;
  if (watchDuration > 120) score += 3;

  // Optional: store aggregated interest later
  // For now, we rely on WatchHistory itself

  return score;
}

module.exports = { processWatchSignal };
