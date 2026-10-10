const express = require("express");
const { authMiddleware } = require("../../../middleware/authMiddleware");

const {
  getComments,
  getReplies,
  createComment,
  editComment,
  deleteComment,
  toggleCommentLike,
} = require("../../comment/controller/Comment.controller");

const router = express.Router();

router.get("/:id/comments", getComments);

router.post("/:id/comments", authMiddleware, createComment);

router.put(
  "/:id/comments/:commentId",
  authMiddleware,
  editComment
);

router.delete(
  "/:id/comments/:commentId",
  authMiddleware,
  deleteComment
);

router.get(
  "/:id/comments/:commentId/replies",
  getReplies
);

router.post(
  "/:id/comments/:commentId/like",
  authMiddleware,
  toggleCommentLike
);

module.exports = router;