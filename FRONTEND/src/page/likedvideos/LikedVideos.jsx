import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { ThumbsUp, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "../../../config/config"

const LikedVideos = () => {
  const token = localStorage.getItem("token")
  const navigate = useNavigate()

  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLikedVideos = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${API_BASE_URL}/videos/likedvideos`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setVideos(res.data.data || [])
      } catch (err) {
        console.error("Failed to fetch liked videos:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLikedVideos()
  }, [])

  const removeLike = async (videoId) => {
    try {
      await axios.delete(`${API_BASE_URL}/videos/like/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setVideos(prev => prev.filter(v => v.video.id !== videoId))
    } catch (err) {
      console.error("Failed to remove like:", err)
    }
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
      <div className="flex items-center gap-3 mb-6">
        <ThumbsUp className="w-6 h-6 text-zinc-500" />
        <div>
          <h1 className="text-2xl font-bold">Liked Videos</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {loading ? "Loading..." : `${videos.length} video${videos.length !== 1 ? "s" : ""}`}
          </p>
        </div>
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
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ThumbsUp className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400 mb-1">No liked videos</h3>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Videos you like will appear here</p>
          <Button className="mt-6" onClick={() => navigate("/")}>Browse videos</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {videos.map(({ video }) => (
            <div
              key={video.id}
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
                {video.views !== undefined && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    {video.views} views
                  </p>
                )}
              </div>

              {/* Remove */}
              <button
                onClick={() => removeLike(video.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500 px-2 flex-shrink-0 self-start mt-1"
                title="Remove from liked videos"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LikedVideos