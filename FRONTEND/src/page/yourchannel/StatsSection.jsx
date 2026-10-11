import { Users, Video, BarChart3 } from "lucide-react"
import { formatNumber } from "./formatters"

const StatsSection = ({ subscriberCount, videosCount, onAnalyticsClick }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      
      {/* Stats Group */}
      <div className="flex flex-wrap items-center gap-3">
        
        {/* Subscribers */}
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-zinc-900/50 border border-zinc-800">
          <Users className="w-4 h-4 text-white" />
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-white text-lg">
              {formatNumber(subscriberCount)}
            </span>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Subs
            </span>
          </div>
        </div>

        {/* Videos */}
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-zinc-900/50 border border-zinc-800">
          <Video className="w-4 h-4 text-white" />
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-white text-lg">
              {videosCount}
            </span>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Videos
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Button - Primary Action */}
      <button
        onClick={onAnalyticsClick}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-all duration-200 shadow-lg shadow-white/5"
      >
        <BarChart3 className="w-4 h-4" />
        <span>View Analytics</span>
      </button>

    </div>
  )
}

export default StatsSection