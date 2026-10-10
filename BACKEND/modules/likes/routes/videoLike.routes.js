const express = require("express");
const { authMiddleware } = require("../../../middleware/authMiddleware");

const {
  likedvideos,
  likeVideo,
  unlikeVideo,
  getVideoLikes,
} = require("../controller/likedvideo.Controller");

const router = express.Router();

router.get(
  "/likedvideos",
  authMiddleware,
  likedvideos
);

router.post(
  "/like/:videoId",
  authMiddleware,
  likeVideo
);

router.delete(
  "/like/:videoId",
  authMiddleware,
  unlikeVideo
);

router.get(
  "/:id/likes",
  authMiddleware,
  getVideoLikes
);

module.exports = router;