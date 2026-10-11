import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { API_BASE_URL } from "../../../config/config"

const HistoryPage = () => {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")

  const [history, setHistory] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const limit = 10

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE_URL}/feed/history?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = res.data.data || []
      setHistory(data)
      setHasMore(data.length === limit)
    } catch (err) {
      console.error("Fetch history error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [page])

  const deleteOne = async (videoId) => {
    try {
      await axios.delete(`${API_BASE_URL}/feed/history/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setHistory(prev => prev.filter(item => item.videoId !== videoId))
    } catch (err) {
      console.error("Delete error:", err)
    }
  }

  const clearAll = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/feed/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setHistory([])
    } catch (err) {
      console.error("Clear history error:", err)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const formatDuration = (seconds) => {
    if (!seconds) return ""
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="text-black dark:text-white">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-zinc-500" />
          <div>
            <h1 className="text-2xl font-bold">Watch History</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Videos you've watched</p>
          </div>
        </div>
        {history.length > 0 && (
          <Button
            variant="ghost"
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 text-sm"
            onClick={clearAll}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear all
          </Button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-40 h-24 rounded-xl flex-shrink-0 bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800" />
                <Skeleton className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800" />
                <Skeleton className="h-3 w-1/4 bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Clock className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400 mb-1">No watch history</h3>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Videos you watch will appear here</p>
          <Button className="mt-6" onClick={() => navigate("/")}>Browse videos</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item) => {
            const video = item.video
            return (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors group"
              >
                {/* Thumbnail */}
                <div
                  className="relative flex-shrink-0 cursor-pointer"
                  onClick={() => navigate(`/videos/${video.id}`)}
                >
                  <img
                    src={video.thumbnailUrl || "https://via.placeholder.com/168x94"}
                    alt={video.title}
                    className="w-40 h-[90px] sm:w-44 sm:h-[99px] object-cover rounded-xl"
                  />
                  {video.duration && (
                    <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-1">
                  <h3
                    onClick={() => navigate(`/videos/${video.id}`)}
                    className="font-semibold text-sm leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                  >
                    {video.title}
                  </h3>
                  <Link
                    to={`/channel/${video.user?.id}`}
                    className="block text-xs text-zinc-500 dark:text-zinc-400 mt-1 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    {video.user?.displayName || video.user?.username || "Unknown Channel"}
                  </Link>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    {formatDate(item.watchedAt)}
                  </p>
                  {video.views !== undefined && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {video.views} views
                    </p>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteOne(item.videoId)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500 px-2 flex-shrink-0 self-start mt-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && history.length > 0 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="dark:border-zinc-700"
          >
            Previous
          </Button>
          <span className="text-sm text-zinc-500">Page {page}</span>
          <Button
            variant="outline"
            disabled={!hasMore}
            onClick={() => setPage(p => p + 1)}
            className="dark:border-zinc-700"
          >
            Next
          </Button>
        </div>
      )}

    </div>
  )
}

export default HistoryPage