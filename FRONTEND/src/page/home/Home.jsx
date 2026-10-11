import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { API_BASE_URL } from "../../../config/config"

const Home = () => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchHomeFeed = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/feed/home`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await res.json()
        setVideos(data?.videos || [])
      } catch (err) {
        console.error("Failed to load home feed", err)
      } finally {
        setLoading(false)
      }
    }
    fetchHomeFeed()
  }, [])

  const handleVideoClick = (videoId) => {
    navigate(`/videos/${videoId}`)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-black dark:text-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-xl bg-gray-200 dark:bg-zinc-800" />
                <div className="flex gap-3">
                  <Skeleton className="h-9 w-9 rounded-full bg-gray-200 dark:bg-zinc-800 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full bg-gray-200 dark:bg-zinc-800" />
                    <Skeleton className="h-3 w-3/4 bg-gray-200 dark:bg-zinc-800" />
                  </div>
                </div>
              </div>
            ))
          : videos.map((video) => (
              <div
                key={video.id}
                className="group cursor-pointer flex flex-col gap-3"
                onClick={() => handleVideoClick(video.id)}
              >
                <div className="relative aspect-video bg-gray-200 dark:bg-zinc-800 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                  <img
                    src={video.thumbnailUrl || "https://via.placeholder.com/320x180"}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex gap-3 items-start">
                  <Avatar className="h-9 w-9 mt-0.5 shrink-0">
                    <AvatarImage src={video.user?.avatarUrl} />
                    <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {video.user?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {video.title}
                    </h3>
                    <p
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/channel/${video.user?.id}`)
                      }}
                      className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      {video.user?.username}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {video.views} views • {formatDate(video.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}

export default Home