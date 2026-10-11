import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import AnalyticsPanel from "./Analytics/AnalyticsPanel"
import { API_BASE_URL } from "../../../config/config"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle } from "lucide-react"

const VideoAnalyticsPage = () => {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = localStorage.getItem("token")

        if (!token) {
          throw new Error("Not authenticated")
        }

        const res = await fetch(
          `${API_BASE_URL}/analytics/video/${videoId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        if (!res.ok) {
          // Try to get error message from backend, fallback to generic
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.message || "Failed to fetch analytics")
        }
        const data = await res.json()
        setAnalytics(data)
      } catch (err) {
        console.error(err)
        setError(err.message || "An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }
    if (videoId) {
      fetchAnalytics()
    }
  }, [videoId])
  // 1. Premium Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-zinc-800 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-2 border-t-white rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-sm text-zinc-500 font-medium tracking-wide">Loading Analytics...</p>
      </div>
    )
  }

  // 2. Error State
  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-lg max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-white mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Data</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline" 
            className="border-white text-white hover:bg-white hover:text-black"
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-black px-6 py-8 md:px-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 3. Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-900 -ml-2 pl-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Video Analytics
            </h1>
            <p className="text-zinc-500 text-sm">
              Detailed performance metrics for video ID: <span className="font-mono text-zinc-300">{videoId}</span>
            </p>
          </div>
          
          {/* Live Indicator */}
          <div className="flex items-center gap-2">
             <span className="text-xs text-zinc-600 uppercase tracking-wider font-semibold">Live Data</span>
             <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          </div>
        </div>

        {/* 4. Main Content with Fade In Animation */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {analytics ? (
            <AnalyticsPanel analytics={analytics} />
          ) : (
            <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
              No analytics data available for this video yet.
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}

export default VideoAnalyticsPage