const express = require("express");
const { createUpload } = require("../controllers/upload");
const { completeUpload } = require("../controllers/completeUpload");
const { updateUploadProgress } = require("../controllers/uploadProgress.controller");
const {
  getVideoById,
  getStreamUrl,
} = require("../controllers/video.controller");
const { authMiddleware } = require("../../../middleware/authMiddleware");
const { cancelVideo } = require("../controllers/videoCancel.controller");
const { deleteVideo } = require("../controllers/videoDelete.controller");
const { updateVideo } = require("../controllers/videoUpdate.controller");
const { retryProcessing } = require("../controllers/videoRetry.controller");
const { getRecommendationsForVideo } = require("../../recommendation/services/videoRecommendation.service");
const { recordView } = require("../controllers/recordView.controller");
const { getWatchRecommendations } = require("../../recommendation/controller/recommend.controller");
const { getAutoplayNext } = require("../../recommendation/controller/autoplay.controller");
const { likedvideos, likeVideo, unlikeVideo, getVideoLikes } = require("../../likes/controller/likedvideo.Controller");
const {
  getComments,
  getReplies,
  createComment,
  editComment,
  deleteComment,
  toggleCommentLike,
} = require("../../comment/controller/Comment.controller");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// liked videos routes FIRST
router.get("/likedvideos", authMiddleware, likedvideos);
router.post("/like/:videoId", authMiddleware, likeVideo);
router.delete("/like/:videoId", authMiddleware, unlikeVideo);

const {
  initChunkSession,
  getChunkUploadUrl,
  recordChunkUploaded,
} = require("../controllers/chunkUpload.controller");
const { directUploadFile } = require("../controllers/directUpload.controller");

// Upload endpoints
router.post("/upload/init", authMiddleware, upload.single("thumbnail"), createUpload);
router.post("/upload/complete", authMiddleware, completeUpload);
router.put("/upload/progress/:videoId", authMiddleware, updateUploadProgress);
router.put("/upload/direct-file/:videoId", authMiddleware, directUploadFile);

// Chunked Upload endpoints (supports UploadSession & UploadChunk schema)
router.post("/upload/chunk-init", authMiddleware, initChunkSession);
router.post("/upload/chunk-url", authMiddleware, getChunkUploadUrl);
router.post("/upload/chunk-complete", authMiddleware, recordChunkUploaded);

// Video endpoints
router.get("/stream/:id", getStreamUrl);
router.get("/:id", getVideoById);

router.post("/:id/cancel", authMiddleware, cancelVideo);
router.delete("/:id", authMiddleware, deleteVideo);
router.put("/:id", authMiddleware, updateVideo);

router.get("/:id/recommendations", getRecommendationsForVideo);
router.get("/:id/autoplay", authMiddleware, getAutoplayNext);

router.post("/:id/view", authMiddleware, recordView);
router.get("/:id/recommend", getWatchRecommendations);

router.post("/:id/retry-processing", authMiddleware, retryProcessing);
router.get("/:id/likes", authMiddleware, getVideoLikes);

// ─── COMMENT ROUTES ────────────────────────────────────────────────────────────
router.get("/:id/comments", getComments);                                          
router.post("/:id/comments", authMiddleware, createComment);                       
router.put("/:id/comments/:commentId", authMiddleware, editComment);               
router.delete("/:id/comments/:commentId", authMiddleware, deleteComment);          
router.get("/:id/comments/:commentId/replies", getReplies);                        
router.post("/:id/comments/:commentId/like", authMiddleware, toggleCommentLike);   

module.exports = router;