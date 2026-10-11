import { useParams } from "react-router-dom"
import {  useState } from "react"
import HlsPlayer from "./HlsPlayer"
import VideoMeta from "./VideoMeta"
import RelatedVideos from "./RelatedVideos"
import CommentSection from "./CommentSection"
import { useVideoData } from "./data/userVideoData"
import { useViewTracking } from "./data/useViewTracker"
import { useVideoActions } from "./data/uservideeoAction"
import { API_BASE_URL } from "../../../config/config"

const Watch = () => {
  const { id } = useParams()
  const token = localStorage.getItem("token")
  const [showFullDescription, setShowFullDescription] = useState(false)
const currentUser = JSON.parse(localStorage.getItem("user") || "null")
  // const currentUser = (() => {
  //   if (!token) return null
  //   try {
  //     const payload = JSON.parse(atob(token.split(".")[1]))
  //     return {
  //       id: payload.id || payload.userId || payload.sub,
  //       username: payload.username,
  //       displayName: payload.displayName || payload.username,
  //       avatarUrl: payload.avatarUrl || null,
  //     }
  //   } catch {
  //     return null
  //   }
  // })()

  const {
    video, setVideo, streamUrl, related, loading,
    liked, setLiked, disliked, setDisliked,
    subscribed, setSubscribed, subscriberCount, setSubscriberCount, channelId,
  } = useVideoData(id, token, API_BASE_URL)

const {
  watchStartRef, sentViewRef, viewIntervalRef,
  onVideoPlay, onVideoPause,        // ← use these now
  sendView, sendWatchTimeUpdate, getWatchDuration
} = useViewTracking(id, token, API_BASE_URL)

  const { handleLike, handleDislike, handleShare, handleSubscribe } = useVideoActions(
    id, token, API_BASE_URL,
    liked, setLiked, disliked, setDisliked,
    subscribed, setSubscribed, subscriberCount, setSubscriberCount,
    channelId, video, setVideo
  )

  const formatViews = (views) => {
    if (!views) return "0"
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }

  const formatDate = (date) => {
    if (!date) return ""
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.ceil(Math.abs(now - d) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-8">
            <div className="space-y-4">
              <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
              <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-3/4 animate-pulse" />
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="hidden xl:flex flex-col gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-40 h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">Video not found</h2>
          <p className="text-zinc-500">This video may have been removed or is unavailable</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-black dark:text-white">
      <div className="max-w-[1800px] mx-auto px-2 sm:px-4 md:px-6 py-4">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">

          {/* LEFT — Player + Meta + Comments */}
          <div className="space-y-4 min-w-0">

            {/* Player */}
            <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video">
              {streamUrl ? (
               <HlsPlayer
  src={streamUrl}
  onPlay={() => {
    onVideoPlay()                   // ← start timer
    if (viewIntervalRef.current) clearTimeout(viewIntervalRef.current)
    viewIntervalRef.current = setTimeout(() => {
      sendView(getWatchDuration())  // ← send view once after 20s
    }, 20000)
  }}
  onPause={() => {
    onVideoPause()                  // ← pause timer
    if (viewIntervalRef.current) clearTimeout(viewIntervalRef.current)
    const duration = getWatchDuration()
    if (duration >= 20) sendWatchTimeUpdate(duration, true)
  }}
  onEnded={() => {
    onVideoPause()                  // ← stop timer
    if (viewIntervalRef.current) clearTimeout(viewIntervalRef.current)
    sendWatchTimeUpdate(getWatchDuration(), true)
  }}
/>

              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                  Stream unavailable
                </div>
              )}
            </div>

            {/* Meta */}
            <VideoMeta
              video={video}
              channelId={channelId}
              subscriberCount={subscriberCount}
              subscribed={subscribed}
              liked={liked}
              disliked={disliked}
              showFullDescription={showFullDescription}
              setShowFullDescription={setShowFullDescription}
              handleLike={handleLike}
              handleDislike={handleDislike}
              handleShare={handleShare}
              handleSubscribe={handleSubscribe}
              formatViews={formatViews}
              formatDate={formatDate}
            />

            {/* Comments */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <CommentSection
                videoId={id}
                currentUser={currentUser}
                token={token}
                initialCount={video.comments || 0}
              />
            </div>
          </div>

          {/* RIGHT — Related */}
          <div className="xl:border-l xl:border-zinc-200 xl:dark:border-zinc-800 xl:pl-6">
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 hidden xl:block">
              Up next
            </h3>
            <RelatedVideos
              videos={related}
              formatViews={formatViews}
              formatDate={formatDate}
            />
          </div>

        </div>
      </div>
    </div>
  )
}

export default Watch