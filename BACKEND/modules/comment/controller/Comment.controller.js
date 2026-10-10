const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

// Extract userId from optional Bearer token (no middleware required)
const getOptionalUserId = (req) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return null;
    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    return decoded.id || decoded.userId || decoded.sub || null;
  } catch {
    return null;
  }
};

// Check if user liked a comment — safe wrapper, won't crash if table missing
const getUserLikedStatus = async (userId, commentId) => {
  if (!userId) return false;
  try {
    const record = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
    return !!record;
  } catch {
    return false; // commentLike table might not exist yet — treat as not liked
  }
};

// Base include for a comment (NO commentLikes — avoids crash before migration)
const commentInclude = {
  user: {
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  },
  _count: { select: { replies: true } },
};

// ─── GET COMMENTS ──────────────────────────────────────────────────────────────
const getComments = async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort || "newest";
    const skip = (page - 1) * limit;
    const userId = getOptionalUserId(req);

    const orderBy =
      sort === "top"
        ? [{ likes: "desc" }, { createdAt: "desc" }]
        : [{ isPinned: "desc" }, { createdAt: "desc" }];

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { videoId, parentId: null },
        orderBy,
        skip,
        take: limit,
        include: {
          ...commentInclude,
          replies: {
            orderBy: { createdAt: "asc" },
            take: 3,
            include: commentInclude,
          },
        },
      }),
      prisma.comment.count({ where: { videoId, parentId: null } }),
    ]);

    // Attach isLikedByUser per comment (batch lookup)
    const allCommentIds = [
      ...comments.map((c) => c.id),
      ...comments.flatMap((c) => c.replies.map((r) => r.id)),
    ];

    let likedSet = new Set();
    if (userId && allCommentIds.length > 0) {
      try {
        const liked = await prisma.commentLike.findMany({
          where: { userId, commentId: { in: allCommentIds } },
          select: { commentId: true },
        });
        likedSet = new Set(liked.map((l) => l.commentId));
      } catch {
        // commentLike table not migrated yet — safe to skip
      }
    }

    const shaped = comments.map((c) => ({
      ...c,
      isLikedByUser: likedSet.has(c.id),
      replies: c.replies.map((r) => ({ ...r, isLikedByUser: likedSet.has(r.id) })),
    }));

    res.json({
      comments: shaped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (err) {
    console.error("getComments error:", err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

// ─── GET REPLIES ───────────────────────────────────────────────────────────────
const getReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = getOptionalUserId(req);

    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where: { parentId: commentId },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
        include: commentInclude,
      }),
      prisma.comment.count({ where: { parentId: commentId } }),
    ]);

    let likedSet = new Set();
    if (userId && replies.length > 0) {
      try {
        const liked = await prisma.commentLike.findMany({
          where: { userId, commentId: { in: replies.map((r) => r.id) } },
          select: { commentId: true },
        });
        likedSet = new Set(liked.map((l) => l.commentId));
      } catch {}
    }

    res.json({
      replies: replies.map((r) => ({ ...r, isLikedByUser: likedSet.has(r.id) })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (err) {
    console.error("getReplies error:", err);
    res.status(500).json({ error: "Failed to fetch replies" });
  }
};

// ─── CREATE COMMENT ────────────────────────────────────────────────────────────
const createComment = async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const userId = req.user.id;
    const { content, parentId } = req.body;

    if (!content?.trim()) return res.status(400).json({ error: "Comment content is required" });
    if (content.trim().length > 2000) return res.status(400).json({ error: "Comment too long (max 2000 chars)" });

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return res.status(404).json({ error: "Video not found" });

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.videoId !== videoId)
        return res.status(404).json({ error: "Parent comment not found" });
    }

    const comment = await prisma.comment.create({
      data: { content: content.trim(), userId, videoId, parentId: parentId || null },
      include: commentInclude,
    });

    res.status(201).json({ ...comment, isLikedByUser: false });
  } catch (err) {
    console.error("createComment error:", err);
    res.status(500).json({ error: "Failed to create comment" });
  }
};

// ─── EDIT COMMENT ──────────────────────────────────────────────────────────────
const editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content?.trim()) return res.status(400).json({ error: "Comment content is required" });
    if (content.trim().length > 2000) return res.status(400).json({ error: "Comment too long (max 2000 chars)" });

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.userId !== userId) return res.status(403).json({ error: "Not authorized" });

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim(), isEdited: true },
      include: commentInclude,  // no commentLikes here — safe always
    });

    const isLikedByUser = await getUserLikedStatus(userId, commentId);
    res.json({ ...updated, isLikedByUser });
  } catch (err) {
    console.error("editComment error:", err);
    res.status(500).json({ error: "Failed to edit comment" });
  }
};

// ─── DELETE COMMENT ────────────────────────────────────────────────────────────
const deleteComment = async (req, res) => {
  try {
    const { id: videoId, commentId } = req.params;
    const userId = req.user.id;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const video = await prisma.video.findUnique({ where: { id: videoId }, select: { userId: true } });
    if (comment.userId !== userId && video?.userId !== userId)
      return res.status(403).json({ error: "Not authorized" });

    await prisma.comment.delete({ where: { id: commentId } });
    res.json({ success: true });
  } catch (err) {
    console.error("deleteComment error:", err);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

// ─── TOGGLE COMMENT LIKE ───────────────────────────────────────────────────────
const toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      // Already liked → unlike
      await Promise.all([
        prisma.commentLike.delete({ where: { userId_commentId: { userId, commentId } } }),
        prisma.comment.update({ where: { id: commentId }, data: { likes: { decrement: 1 } } }),
      ]);
      res.json({ liked: false, likes: Math.max(0, comment.likes - 1) });
    } else {
      // Not liked → like
      await Promise.all([
        prisma.commentLike.create({ data: { userId, commentId } }),
        prisma.comment.update({ where: { id: commentId }, data: { likes: { increment: 1 } } }),
      ]);
      res.json({ liked: true, likes: comment.likes + 1 });
    }
  } catch (err) {
    console.error("toggleCommentLike error:", err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
};

module.exports = {
  getComments,
  getReplies,
  createComment,
  editComment,
  deleteComment,
  toggleCommentLike,
};