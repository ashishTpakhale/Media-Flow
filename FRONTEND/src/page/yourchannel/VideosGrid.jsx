import VideoRow from "./VideoRow"
import { Video } from "lucide-react" // Optional: for the empty state icon

const VideosGrid = ({
  loading,
  videos,
  handleEditClick,
  handleDeleteVideo,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        {/* Refined Spinner: White accent on dark background */}
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
        <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
          <Video className="w-6 h-6 text-zinc-500" />
        </div>
        <h3 className="text-lg font-semibold text-white">
          No videos uploaded
        </h3>
        <p className="mt-2 text-sm text-zinc-400 max-w-xs">
          Your uploaded videos will appear here. Start creating content to see them listed.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden bg-black">
      {videos.map((video) => (
        <VideoRow
          key={video.id}
          video={video}
          handleEditClick={handleEditClick}
          handleDeleteVideo={handleDeleteVideo}
        />
      ))}
    </div>
  )
}

export default VideosGrid