const express = require("express");
const { registerUser, loginUser, updateUser, deleteUser, aboutme, getMyUploadedVideos, getChannelDetails } = require("../controller/authController");
const { authMiddleware } = require("../../../middleware/authMiddleware");
const upload = require("../../../middleware/upload");


const router = express.Router();

// routes/authRoutes.js
router.post("/register", registerUser);
router.get("/aboutme", authMiddleware, aboutme);
router.post("/login", loginUser);
router.put(
  "/update",
  authMiddleware,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 }
  ]),
  updateUser
);
router.delete("/delete", authMiddleware, deleteUser);
router.get("/my-videos", authMiddleware, getMyUploadedVideos);

router.get("/channel/:channelId", getChannelDetails);

module.exports = router;