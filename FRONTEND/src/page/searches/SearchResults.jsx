// src/pages/SearchResultsPage.jsx
// CORRECTED VERSION - Handles backend {type, data} format properly

import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { Clock, Eye, User, CheckCircle2, Filter } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "../../../config/config"

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get("q")

  const [results, setResults] = useState({ items: [], nextCursor: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [intent, setIntent] = useState(null)
  const [filterType, setFilterType] = useState("all")

  useEffect(() => {
    if (!query) {
      navigate("/")
      return
    }
    fetchResults()
  }, [query])

  const fetchResults = async (cursor = null) => {
    try {
      setLoading(true)
      setError(null)

      const url = cursor
        ? `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&cursor=${cursor}`
        : `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })


      setIntent(res.data.intent)

      // Transform backend results: {type, data} → flat items with type
      const parsedItems = (res.data.results || []).map(entry => ({
        ...entry.data,
        type: entry.type
      }))

      if (cursor) {
        setResults((prev) => ({
          items: [...prev.items, ...parsedItems],
          nextCursor: res.data.nextCursor,
        }))
      } else {
        setResults({
          items: parsedItems,
          nextCursor: res.data.nextCursor,
        })
      }
    } catch (err) {
      console.error("Search error:", err)
      setError("Failed to load search results")
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (results.nextCursor && !loading) {
      fetchResults(results.nextCursor)
    }
  }

  // Filter results
  const filteredResults = results.items.filter(item => {
    if (filterType === "all") return true
    if (filterType === "videos") return item.type === "video"
    if (filterType === "channels") return item.type === "channel"
    return true
  })

  const formatViews = (count) => {
    if (!count) return "0"
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const formatDate = (date) => {
    if (!date) return "Unknown"
    const now = new Date()
    const past = new Date(date)
    const diffTime = Math.abs(now - past)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const handleVideoClick = (videoId) => {
    navigate(`/videos/${videoId}`)
  }

  const handleChannelClick = (channelId) => {
    navigate(`/channel/${channelId}`)
  }

  if (!query) return null

  return (
<div className="w-full">
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Header with Filters */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">
              Search results for "{query}"
            </h1>
            <Button variant="ghost" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-zinc-800 pb-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterType === "all"
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("videos")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterType === "videos"
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => setFilterType("channels")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterType === "channels"
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
              }`}
            >
              Channels
            </button>
          </div>

          {intent && typeof intent === 'object' && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              {intent.video > intent.channel 
                ? 'Showing video-focused results' 
                : intent.channel > intent.video 
                ? 'Showing channel-focused results' 
                : 'Showing mixed results'}
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {filteredResults.map((item, index) => (
            <div key={`${item.type}-${item.id}-${index}`}>
              {item.type === "video" ? (
                <VideoResult
                  video={item}
                  onClick={() => handleVideoClick(item.id)}
                  formatViews={formatViews}
                  formatDate={formatDate}
                />
              ) : (
                <ChannelResult
                  channel={item}
                  onClick={() => handleChannelClick(item.id)}
                />
              )}
            </div>
          ))}

          {/* Loading Skeleton */}
          {loading && (
            <>
              <SearchResultSkeleton />
              <SearchResultSkeleton />
              <SearchResultSkeleton />
            </>
          )}

          {/* No Results */}
          {!loading && filteredResults.length === 0 && (
            <div className="text-center py-12">
              <div className="w-32 h-32 mx-auto mb-4 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                <Eye className="w-16 h-16 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                No results found for "{query}"
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Try different keywords or remove search filters
              </p>
            </div>
          )}

          {/* Load More */}
          {results.nextCursor && !loading && (
            <div className="flex justify-center py-8">
              <button
                onClick={loadMore}
                className="px-6 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full font-medium transition-colors flex items-center gap-2"
              >
                Load more results
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ==================== VIDEO RESULT COMPONENT ==================== */
const VideoResult = ({ video, onClick, formatViews, formatDate }) => {
  return (
    <div
      onClick={onClick}
      className="flex gap-4 cursor-pointer group hover:bg-gray-50 dark:hover:bg-zinc-900/50 p-2 rounded-lg transition-colors"
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-80 h-44 bg-gray-200 dark:bg-zinc-800 rounded-xl overflow-hidden">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Eye className="w-12 h-12 text-gray-400 dark:text-gray-600" />
          </div>
        )}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            {video.duration}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 py-1">
        <h3 className="text-lg font-semibold line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {video.title || "Untitled Video"}
        </h3>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {formatViews(video.views || 0)} views
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDate(video.createdAt)}
          </span>
        </div>

        {/* Channel Info */}
        {video.channel && (
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="w-6 h-6">
              <AvatarImage src={video.channel.avatarUrl} />
              <AvatarFallback className="text-xs">
                {video.channel.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
              {video.channel.username || "Unknown Channel"}
            </span>
            {video.channel.verified && (
              <CheckCircle2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </div>
        )}

        {/* Description */}
        {video.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {video.description}
          </p>
        )}
      </div>
    </div>
  )
}

/* ==================== CHANNEL RESULT COMPONENT ==================== */
const ChannelResult = ({ channel, onClick }) => {
  const formatSubscribers = (count) => {
    if (!count) return "0"
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  return (
    <div
      onClick={onClick}
      className="flex items-start gap-6 cursor-pointer group hover:bg-gray-50 dark:hover:bg-zinc-900/50 p-4 rounded-lg transition-colors"
    >
      <Avatar className="w-32 h-32 flex-shrink-0 group-hover:ring-2 ring-blue-500 transition-all">
        <AvatarImage src={channel.avatarUrl} />
        <AvatarFallback className="text-3xl">
          {channel.username?.[0]?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {channel.username || "Unknown Channel"}
          </h3>
          {channel.verified && (
            <CheckCircle2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </div>

        {channel.displayName && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {channel.displayName}
          </p>
        )}

        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
          {channel.subscriberCount !== undefined && (
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {formatSubscribers(channel.subscriberCount)} subscribers
            </span>
          )}
          {channel.videoCount !== undefined && (
            <>
              <span>•</span>
              <span>{channel.videoCount} videos</span>
            </>
          )}
        </div>

        {channel.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {channel.description}
          </p>
        )}

        <button 
          onClick={(e) => {
            e.stopPropagation()
            // Handle subscribe action
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors"
        >
          Subscribe
        </button>
      </div>
    </div>
  )
}

/* ==================== LOADING SKELETON ==================== */
const SearchResultSkeleton = () => {
  return (
    <div className="flex gap-4 p-2">
      <Skeleton className="w-80 h-44 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
}

export default SearchResultsPage