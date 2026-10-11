import { Info, Settings } from "lucide-react"
import { formatNumber } from "./formatters"

const Header = ({
  aboutData,
  subscriberCount,
  handleAboutClick,
  handleSettingsClick
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">

        {/* Left: Profile Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-zinc-700 bg-black overflow-hidden flex items-center justify-center font-semibold text-lg text-white shrink-0">
            {aboutData?.data?.avatarUrl ? (
              <img
                src={aboutData.data.avatarUrl}
                alt="Channel avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              aboutData?.data?.displayName?.[0]?.toUpperCase() || "U"
            )}
          </div>

          <div className="leading-tight min-w-0">
            <h1 className="text-lg font-semibold text-white truncate">
              {aboutData?.data?.displayName || "Your Channel"}
            </h1>
            <p className="text-sm text-zinc-400">
              {formatNumber(subscriberCount)} subscribers
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          
          {/* About Button */}
          <button
            onClick={handleAboutClick}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all"
            aria-label="About"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">About</span>
          </button>

          {/* Customize Button */}
          <button
            onClick={handleSettingsClick}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-white text-black border border-white hover:bg-gray-200 transition-all"
            aria-label="Customize Channel"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">Customize</span>
          </button>
          
        </div>
      </div>
    </header>
  )
}

export default Header