import { useEffect, useState } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { API_BASE_URL } from "../../../config/config"

const Subscriptions = () => {
  const token = localStorage.getItem("token")

  const [channels, setChannels] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [channelRes, videoRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/subscriptions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/subscriptions/videos`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        // Extract channel from each subscription item
        const subs = channelRes.data.data || []
        setChannels(subs.map(sub => sub.channel))

        setVideos(videoRes.data.videos || [])
      } catch (err) {
        console.error("Subscriptions load failed:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleUnsubscribe = async (channelId) => {
    try {
      await axios.delete(`${API_BASE_URL}/subscribe/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setChannels(prev => prev.filter(c => c.id !== channelId))
      setVideos(prev => prev.filter(v => v.user?.id !== channelId))
    } catch (err) {
      console.error("Unsubscribe failed:", err)
    }
  }

  if (loading) {
    return (
      <div className="pt-20 text-center text-gray-500">
        Loading subscriptions...
      </div>
    )
  }

  if (channels.length === 0) {
    return (
      <div className="pt-20 text-center text-gray-500">
        You haven't subscribed to any channels yet.
      </div>
    )
  }

  return (
    <div className="text-black dark:text-white">

      {/* Channel strip */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Subscriptions</h2>
        <div
          className="flex items-center gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {channels.slice(0, 8).map(channel => (
            <Link
              key={channel.id}
              to={`/channel/${channel.id}`}
              className="flex flex-col items-center flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              {channel.avatarUrl ? (
                <img
                  src={channel.avatarUrl}
                  alt={channel.username}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-lg font-bold">
                  {channel.displayName?.[0]?.toUpperCase() || channel.username?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <span className="text-xs mt-1 w-14 text-center truncate">
                {channel.displayName || channel.username}
              </span>
            </Link>
          ))}

          {channels.length > 8 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-shrink-0">See All</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[500px] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>All Subscriptions</DialogTitle>
                </DialogHeader>
                {channels.map(channel => (
                  <div key={channel.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      {channel.avatarUrl ? (
                        <img
                          src={channel.avatarUrl}
                          alt={channel.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center font-bold">
                          {channel.displayName?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <span>{channel.displayName || channel.username}</span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnsubscribe(channel.id)}
                    >
                      Unsubscribe
                    </Button>
                  </div>
                ))}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Video feed */}
      {videos.length === 0 ? (
        <p className="text-gray-500 text-sm">No videos from subscribed channels yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map(video => (
            <Link key={video.id} to={`/videos/${video.id}`} className="group">
              <div className="space-y-2">
                <div className="w-full aspect-video overflow-hidden rounded-xl bg-gray-200 dark:bg-zinc-800">
                  <img
                    src={video.thumbnailUrl || "https://via.placeholder.com/320"}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-500 transition-colors">
                  {video.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {video.user?.displayName || video.user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {video.views} views
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}

export default Subscriptions