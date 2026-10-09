const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "of", "for", "to", "in", "on", "with", "by"
]);

const VIDEO_HINTS = new Set([
  "tutorial", "course", "explained", "review", "lecture", "full", "video"
]);

const CHANNEL_HINTS = new Set([
  "channel", "official", "creator", "vlog", "shorts"
]);

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return text.split(" ").filter(Boolean);
}

function removeStopWords(tokens) {
  return tokens.filter(t => !STOP_WORDS.has(t));
}

function detectIntent(tokens) {
  let videoScore = 0;
  let channelScore = 0;

  for (const token of tokens) {
    if (VIDEO_HINTS.has(token)) videoScore += 2;
    if (CHANNEL_HINTS.has(token)) channelScore += 2;
  }

  // Username-style heuristic
  if (tokens.length <= 2 && videoScore === 0) {
    channelScore += 1;
  }

  const total = videoScore + channelScore || 1;

  return {
    video: videoScore / total,
    channel: channelScore / total
  };
}

module.exports = {
  parse(rawQuery) {
    const normalizedQuery = normalize(rawQuery);
    const tokens = tokenize(normalizedQuery);
    const significantTokens = removeStopWords(tokens);
    const intent = detectIntent(significantTokens);

    return {
      originalQuery: rawQuery,
      normalizedQuery,
      tokens,
      significantTokens,
      intent
    };
  }
};
