    const express = require("express");
    const { authMiddleware } = require("../../../middleware/authMiddleware");
    const { subscribeChannel, unsubscribeChannel ,getSubscribedChannels , getSubscriberCount , checkSubscription, getSubscribedVideos } = require("../controller/subscriptions.controller");


    const router = express.Router();

    router.post("/subscribe/:channelId", authMiddleware, subscribeChannel);
    router.delete("/subscribe/:channelId", authMiddleware, unsubscribeChannel);
router.get(
  "/subscriptions/videos",
  authMiddleware,
  getSubscribedVideos
);

    router.get("/subscriptions", authMiddleware, getSubscribedChannels);
    router.get("/subscribers/:channelId", getSubscriberCount);
    router.get("/subscribe/check/:channelId", authMiddleware, checkSubscription);

    module.exports = router;
