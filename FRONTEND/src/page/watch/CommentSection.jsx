import { useState, useEffect, useRef, useCallback } from "react"
import axios from "axios"
import { 
  ThumbsUp, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  Smile, 
  Loader2,
  MessageSquare
} from "lucide-react"
import { API_BASE_URL } from "../../../config/config"


// ─── AVATAR ───────────────────────────────────────────────────────────────────
const Avatar = ({ user, size = "md" }) => {
  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  }
  const initials = (user?.displayName || user?.username || "?")[0].toUpperCase()
  
  return user?.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={user.displayName || user.username}
      className={`${sizeMap[size]} rounded-full object-cover flex-shrink-0 bg-zinc-800`}
    />
  ) : (
    <div
      className={`${sizeMap[size]} rounded-full flex-shrink-0 flex items-center justify-center font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700`}
    >
      {initials}
    </div>
  )
}

// ─── FORMAT DATE ──────────────────────────────────────────────────────────────
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return ""
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  const w = Math.floor(d / 7)
  if (w < 4) return `${w}w ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo ago`
  return `${Math.floor(d / 365)}y ago`
}

// ─── COMMENT INPUT BOX ────────────────────────────────────────────────────────
const CommentInput = ({
  user,
  onSubmit,
  placeholder = "Add a comment...",
  initialValue = "",
  compact = false,
  onCancel,
  autoFocus = false,
}) => {
  const [text, setText] = useState(initialValue)
  const [focused, setFocused] = useState(autoFocus || !!initialValue)
  const textareaRef = useRef(null)
  const mouseDownOnActions = useRef(false)

  useEffect(() => {
    if ((autoFocus || initialValue) && textareaRef.current) {
      textareaRef.current.focus()
      const len = initialValue.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [])

  const autoResize = () => {
    const el = textareaRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = Math.min(el.scrollHeight, 200) + "px"
    }
  }

  const handleSubmit = () => {
    if (!text.trim()) return
    onSubmit(text.trim())
    setText("")
    setFocused(false)
    mouseDownOnActions.current = false
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.blur()
    }
  }

  const handleCancel = () => {
    setText(initialValue)
    setFocused(false)
    mouseDownOnActions.current = false
    onCancel?.()
  }

  const handleBlur = () => {
    if (mouseDownOnActions.current) return
    if (!text.trim()) setFocused(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === "Escape") handleCancel()
  }

  return (
    <div className={`flex gap-3 items-start w-full`}>
      {!compact && user && <Avatar user={user} size="md" />}
      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={text}
          rows={1}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          onChange={(e) => {
            setText(e.target.value)
            autoResize()
          }}
          onKeyDown={handleKeyDown}
          className={`
            w-full resize-none overflow-hidden bg-transparent border-b outline-none
            ${focused ? "border-white" : "border-zinc-700"}
            text-sm text-zinc-100 placeholder-zinc-500
            py-2 leading-relaxed transition-colors duration-200
          `}
        />
        {focused && (
          <div
            className="flex items-center justify-end gap-2 mt-3"
            onMouseDown={(e) => {
              mouseDownOnActions.current = true
              e.preventDefault()
            }}
            onMouseUp={() => { mouseDownOnActions.current = false }}
            onTouchStart={() => { mouseDownOnActions.current = true }}
            onTouchEnd={() => { mouseDownOnActions.current = false }}
          >
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-full text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {initialValue ? "Save" : "Comment"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SINGLE COMMENT ───────────────────────────────────────────────────────────
const CommentItem = ({
  comment,
  currentUser,
  token,
  videoId,
  isReply = false,
  onDeleted,
  onUpdated,
}) => {
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState(comment.replies || [])
  const [repliesPage, setRepliesPage] = useState(1)
  const [repliesTotal, setRepliesTotal] = useState(comment._count?.replies || 0)
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [liked, setLiked] = useState(comment.isLikedByUser ?? false)
  const [likes, setLikes] = useState(comment.likes || 0)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  const isOwner = currentUser?.id === comment.user?.id
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("touchstart", handler)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("touchstart", handler)
    }
  }, [])

  const loadReplies = async (page = 1) => {
    if (loadingReplies) return
    setLoadingReplies(true)
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/videos/${videoId}/comments/${comment.id}/replies?page=${page}&limit=10`
      )
      if (page === 1) setReplies(data.replies)
      else setReplies((prev) => [...prev, ...data.replies])
      setRepliesTotal(data.pagination.total)
      setRepliesPage(page)
    } catch (err) {
      console.error("loadReplies error:", err)
    } finally {
      setLoadingReplies(false)
    }
  }

  const handleShowReplies = () => {
    if (!showReplies) {
      loadReplies(1)
      setShowReplies(true)
    } else {
      setShowReplies(false)
    }
  }

  const handleReplySubmit = async (content) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/videos/${videoId}/comments`,
        { content, parentId: comment.id },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setReplies((prev) => [...prev, data])
      setRepliesTotal((prev) => prev + 1)
      setShowReplies(true)
      setReplying(false)
    } catch (err) {
      console.error("handleReplySubmit error:", err)
    }
  }

  const handleEditSubmit = async (content) => {
    try {
      const { data } = await axios.put(
        `${API_BASE_URL}/videos/${videoId}/comments/${comment.id}`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onUpdated?.(data)
      setEditing(false)
    } catch (err) {
      console.error("handleEditSubmit error:", err)
    }
  }

  const handleDelete = async () => {
    setShowMenu(false)
    if (!window.confirm("Delete this comment?")) return
    try {
      await axios.delete(`${API_BASE_URL}/videos/${videoId}/comments/${comment.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      onDeleted?.(comment.id)
    } catch (err) {
      console.error("handleDelete error:", err)
    }
  }

  const handleLike = async () => {
    if (!token) return
    const prevLiked = liked
    const prevLikes = likes
    setLiked(!liked)
    setLikes((prev) => (liked ? prev - 1 : prev + 1))
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/videos/${videoId}/comments/${comment.id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLiked(data.liked)
      setLikes(data.likes)
    } catch (err) {
      setLiked(prevLiked)
      setLikes(prevLikes)
    }
  }

  return (
    <div className={`flex gap-3 group ${isReply ? "ml-0 mt-4" : ""}`}>
      <div className="flex-shrink-0">
         <Avatar user={comment.user} size={isReply ? "sm" : "md"} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-sm font-semibold text-zinc-100 truncate">
              {comment.user?.displayName || comment.user?.username}
            </span>
            {comment.isPinned && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Pinned
              </span>
            )}
            <span className="text-xs text-zinc-500 flex-shrink-0">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-zinc-600">(edited)</span>
            )}
          </div>

          {/* Menu */}
          {isOwner && (
            <div
              className="relative flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              ref={menuRef}
            >
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 z-20 min-w-[140px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => { setEditing(true); setShowMenu(false) }}
                    className="w-full text-left text-sm px-4 py-3 text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full text-left text-sm px-4 py-3 text-red-400 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Body or edit */}
        {editing ? (
          <div className="mt-3">
            <CommentInput
              user={currentUser}
              onSubmit={handleEditSubmit}
              initialValue={comment.content}
              compact
              autoFocus
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          <p className="mt-1.5 text-sm text-zinc-200 leading-relaxed break-words whitespace-pre-wrap">
            {comment.content}
          </p>
        )}

        {/* Action buttons */}
        {!editing && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-full transition-colors ${
                liked
                  ? "text-blue-400"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
              {likes > 0 && <span>{likes}</span>}
            </button>

            {!isReply && token && (
              <button
                onClick={() => setReplying((prev) => !prev)}
                className="text-xs px-3 py-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 font-medium transition-colors"
              >
                Reply
              </button>
            )}

            {!isReply && repliesTotal > 0 && (
              <button
                onClick={handleShowReplies}
                className="text-xs px-3 py-1.5 rounded-full text-blue-400 hover:text-blue-300 hover:bg-zinc-800 font-medium transition-colors"
              >
                {showReplies
                  ? "Hide replies"
                  : `${repliesTotal} ${repliesTotal === 1 ? "reply" : "replies"}`}
              </button>
            )}
          </div>
        )}

        {/* Reply input */}
        {replying && (
          <div className="mt-4 mb-2">
            <CommentInput
              user={currentUser}
              onSubmit={handleReplySubmit}
              placeholder={`Reply to @${comment.user?.username}...`}
              compact
              autoFocus
              onCancel={() => setReplying(false)}
            />
          </div>
        )}

        {/* Replies */}
        {showReplies && (
          <div className="mt-4 space-y-4 border-l-2 border-zinc-800 pl-4 ml-1">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUser={currentUser}
                token={token}
                videoId={videoId}
                isReply
                onDeleted={(id) => {
                  setReplies((prev) => prev.filter((r) => r.id !== id))
                  setRepliesTotal((prev) => prev - 1)
                }}
                onUpdated={(updated) =>
                  setReplies((prev) =>
                    prev.map((r) => (r.id === updated.id ? updated : r))
                  )
                }
              />
            ))}

            {replies.length < repliesTotal && (
              <button
                onClick={() => loadReplies(repliesPage + 1)}
                disabled={loadingReplies}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50 py-1 flex items-center gap-2"
              >
                {loadingReplies ? (
                   <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                   </>
                ) : (
                   `Show more replies`
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SORT TOGGLE ──────────────────────────────────────────────────────────────
const SortButton = ({ value, current, onChange, label }) => (
  <button
    onClick={() => onChange(value)}
    className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
      current === value
        ? "bg-zinc-800 text-zinc-100"
        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
    }`}
  >
    {label}
  </button>
)

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
const CommentSection = ({ videoId, currentUser, token, initialCount = 0 }) => {
  const [comments, setComments] = useState([])
  const [total, setTotal] = useState(initialCount)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sort, setSort] = useState("newest")
  const [error, setError] = useState(null)

  const fetchComments = useCallback(
    async (pageNum = 1, currentSort = sort, reset = false) => {
      pageNum === 1 ? setLoading(true) : setLoadingMore(true)
      setError(null)
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/videos/${videoId}/comments?page=${pageNum}&limit=20&sort=${currentSort}`
        )
        setComments((prev) =>
          reset || pageNum === 1 ? data.comments : [...prev, ...data.comments]
        )
        setTotal(data.pagination.total)
        setHasMore(data.pagination.hasMore)
        setPage(pageNum)
      } catch {
        setError("Failed to load comments. Please try again.")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [videoId, sort]
  )

  useEffect(() => {
    fetchComments(1, sort, true)
  }, [videoId, sort])

  const handleNewComment = async (content) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/videos/${videoId}/comments`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setComments((prev) => [data, ...prev])
      setTotal((prev) => prev + 1)
    } catch (err) {
      console.error("handleNewComment error:", err)
    }
  }

  return (
    <div className="pt-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          {total > 0 ? `${total.toLocaleString()} Comments` : "Comments"}
        </h2>
        <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-full">
          <SortButton value="newest" current={sort} onChange={setSort} label="Newest" />
          <SortButton value="top" current={sort} onChange={setSort} label="Top" />
        </div>
      </div>

      {/* Input */}
      {currentUser ? (
        <div className="mb-8">
          <CommentInput
            user={currentUser}
            onSubmit={handleNewComment}
            placeholder="Add a comment..."
          />
        </div>
      ) : (
        <div className="mb-8 text-sm text-zinc-500 py-4 px-5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
          <MessageSquare className="w-5 h-5" />
          Sign in to leave a comment
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-3 bg-zinc-800 rounded w-32" />
                <div className="h-3 bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-zinc-800 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-8">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button
            onClick={() => fetchComments(1, sort, true)}
            className="text-sm px-4 py-2 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && comments.length === 0 && (
        <div className="text-center py-12 text-zinc-500 flex flex-col items-center">
          <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm">No comments yet. Be the first to start the conversation!</p>
        </div>
      )}

      {/* List */}
      {!loading && (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              token={token}
              videoId={videoId}
              onDeleted={(id) => {
                setComments((prev) => prev.filter((c) => c.id !== id))
                setTotal((prev) => prev - 1)
              }}
              onUpdated={(updated) =>
                setComments((prev) =>
                  prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
                )
              }
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && !error && (
        <div className="mt-8 text-center">
          <button
            onClick={() => fetchComments(page + 1)}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-full text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            ) : "Show more comments"}
          </button>
        </div>
      )}
    </div>
  )
}

export default CommentSection