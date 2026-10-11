import { useEffect, useState } from "react"
import { getMyVideos, getVideoAnalytics } from "./api"
import VideoSelector from "./VideoSelector"
import AnalyticsCards from "./AnalyticsCards"
import ViewsChart from "./ViewsChart"
import WatchTimeChart from "./WatchTimeChart"

export default function AnalyticsPage() {
  const [videos, setVideos] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    getMyVideos().then(res => {
            setVideos(res.data.videos)   // ✅ THIS

      setSelectedVideo(res.data[0])
    })
  }, [])

  useEffect(() => {
    if (!selectedVideo) return
    getVideoAnalytics(selectedVideo.id).then(res =>
      setAnalytics(res.data)
    )
  }, [selectedVideo])

  return (
    <div className="p-6 space-y-6">
      <VideoSelector
        videos={videos}
        selected={selectedVideo}
        onSelect={setSelectedVideo}
      />

      {analytics && (
        <>
          <AnalyticsCards analytics={analytics} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ViewsChart data={analytics.viewsOverTime} />
            <WatchTimeChart data={analytics.watchTimeOverTime} />
          </div>
        </>
      )}
    </div>
  )
}
