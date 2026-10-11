import { Link } from "react-router-dom"
import { ThumbsUp, ThumbsDown, Share2, ChevronDown, ChevronUp } from "lucide-react"

const VideoMeta = ({
  video,
  channelId,
  subscriberCount,
  subscribed,
  liked,
  disliked,
  showFullDescription,
  setShowFullDescription,
  handleLike,
  handleDislike,
  handleShare,
  handleSubscribe,
  formatViews,
  formatDate,
}) => {
  return (
    <>
      {/* TITLE */}
      <h1 className="text-[20px] font-semibold leading-snug pr-6">
        {video.title}
      </h1>

      {/* CHANNEL + ACTIONS */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        {/* CHANNEL */}
     <Link
  to={`/channel/${channelId}`}
  className="flex items-center gap-3 hover:opacity-90"
>
  {/* AVATAR IMAGE */}
  {video.user?.avatarUrl ? (
    <img
      src={video.user.avatarUrl}
      alt={video.user.username || "User"}
      className="w-10 h-10 rounded-full object-cover"
    />
  ) : (
    // FALLBACK: Initials
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
      {video.user?.username?.[0]?.toUpperCase() || "U"}
    </div>
  )}

  <div className="flex flex-col">
    <span className="font-semibold text-sm hover:underline">
      {video.user?.username || "Unknown"}
    </span>
    <span className="text-xs text-gray-600 dark:text-gray-400">
      {formatViews(subscriberCount)} subscribers
    </span>
  </div>
</Link>

        {/* SUBSCRIBE */}
        <button
          onClick={handleSubscribe}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            subscribed
              ? "bg-gray-200 dark:bg-zinc-800 text-black dark:text-white"
              : "bg-black dark:bg-white text-white dark:text-black"
          }`}
        >
          {subscribed ? "Subscribed" : "Subscribe"}
        </button>

        {/* LIKE / SHARE */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 ${
                liked ? "text-blue-600" : ""
              }`}
            >
              <ThumbsUp className="w-5 h-5" />
              <span className="text-sm font-medium">
                {formatViews(video.likes || 0)}
              </span>
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-zinc-700" />

            <button
              onClick={handleDislike}
              className={`px-4 py-2 ${disliked ? "text-blue-600" : ""}`}
            >
              <ThumbsDown className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-full"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="bg-gray-100 dark:bg-zinc-800 rounded-xl p-3">
        <div className="flex items-center gap-2 text-sm font-semibold mb-1">
          <span>{formatViews(video.views || 0)} views</span>
          <span>•</span>
          <span>{formatDate(video.createdAt)}</span>
        </div>

        {video.description && (
          <div className="text-sm">
            <p
              className={`whitespace-pre-wrap ${
                !showFullDescription ? "line-clamp-2" : ""
              }`}
            >
              {video.description}
            </p>

            {video.description.length > 100 && (
              <button
                onClick={() => setShowFullDescription(p => !p)}
                className="flex items-center gap-1 font-semibold"
              >
                {showFullDescription ? (
                  <>Show less <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>...more <ChevronDown className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default VideoMeta
