const express = require("express");
const { authMiddleware } = require("../../../middleware/authMiddleware");
const { getHomeFeed, getTrendingFeed ,getHybridHomeFeed, clearAllHistory, deleteHistoryItem, getWatchHistory } = require("../controller/feed.controller");
const { recordView } = require("../../video/controllers/videoView.controller");

const router = express.Router();

// Public home feed (auth optional, but keep it for now)
router.get("/home", authMiddleware, getHomeFeed);
router.post("/:id/view", authMiddleware, recordView);
router.get("/trending", authMiddleware, getTrendingFeed);
router.get("/hybrid", authMiddleware, getHybridHomeFeed);
//history
router.get("/history", authMiddleware, getWatchHistory);

router.delete("/history/:videoId", authMiddleware, deleteHistoryItem);
router.delete("/history", authMiddleware, clearAllHistory);

module.exports = router;
