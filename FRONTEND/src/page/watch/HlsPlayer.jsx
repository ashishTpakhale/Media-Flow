import Hls from "hls.js"
import { useEffect, useRef, useState, useCallback } from "react"
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, Check, SkipForward, SkipBack, Loader2
} from "lucide-react"

const formatTime = (seconds) => {
  if (isNaN(seconds)) return "0:00"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  return `${m}:${s.toString().padStart(2, "0")}`
}

const HlsPlayer = ({ src, onPlay, onPause, onEnded }) => {
  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const containerRef = useRef(null)
  const controlsTimerRef = useRef(null)
  const progressRef = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [qualities, setQualities] = useState([])
  const [currentQuality, setCurrentQuality] = useState(-1)
  const [loading, setLoading] = useState(true)
  const [seeking, setSeeking] = useState(false)

  // ── HLS Setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!src || !videoRef.current) return

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 })
      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(videoRef.current)

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setQualities(data.levels.map((l, i) => ({
          index: i,
          label: l.height ? `${l.height}p` : `Level ${i}`,
          height: l.height,
        })))
        setCurrentQuality(-1)
        setLoading(false)
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad()
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError()
          else hls.destroy()
        }
      })

      return () => hls.destroy()
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = src
      setLoading(false)
    }
  }, [src])

  // ── Controls auto-hide ─────────────────────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    clearTimeout(controlsTimerRef.current)
    if (playing) {
      controlsTimerRef.current = setTimeout(() => {
        if (!showSettings) setShowControls(false)
      }, 3000)
    }
  }, [playing, showSettings])

  useEffect(() => {
    return () => clearTimeout(controlsTimerRef.current)
  }, [])

  // ── Video event handlers ───────────────────────────────────────────────────
  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v) return
    setCurrentTime(v.currentTime)
    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1))
    }
  }

  const handlePlayPause = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else { v.pause(); setPlaying(false) }
    resetControlsTimer()
  }

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (videoRef.current) videoRef.current.volume = val
    setMuted(val === 0)
  }

  const handleMuteToggle = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const handleSeek = (e) => {
    if (!progressRef.current || !videoRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const pct = x / rect.width
    videoRef.current.currentTime = pct * duration
    setCurrentTime(pct * duration)
  }

  const handleSkip = (secs) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + secs, duration))
    resetControlsTimer()
  }

  const handleQualityChange = (index) => {
    if (!hlsRef.current) return
    hlsRef.current.currentLevel = index
    setCurrentQuality(index)
    setShowSettings(false)
    resetControlsTimer()
  }

  const handleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  const currentQualityLabel = currentQuality === -1 ? "Auto" : qualities[currentQuality]?.label || "Auto"
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0

  return (
<div
  ref={containerRef}
  className="relative w-full h-full bg-black select-none overflow-hidden group"
  onMouseMove={resetControlsTimer}
  onMouseLeave={() => playing && setShowControls(false)}
  onTouchStart={resetControlsTimer}
>
      {/* Video */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        className="w-full h-full object-contain"
        onPlay={() => { setPlaying(true); onPlay?.(); resetControlsTimer() }}
        onPause={() => { setPlaying(false); onPause?.(); setShowControls(true) }}
        onEnded={() => { setPlaying(false); onEnded?.(); setShowControls(true) }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-12 h-12 text-white/80 animate-spin" />
        </div>
      )}

      {/* Click to play/pause */}
      <div
        className="absolute inset-0 z-[5] cursor-pointer"
        onClick={handlePlayPause}
      />
      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        <div className="relative z-10 px-4 pb-3 space-y-2">

          {/* Progress bar */}
          <div
            ref={progressRef}
            className="relative h-1 group/progress cursor-pointer"
            onClick={handleSeek}
            onMouseDown={() => setSeeking(true)}
            onMouseUp={() => setSeeking(false)}
          >
            {/* Track */}
            <div className="absolute inset-0 rounded-full bg-white/20 hover:h-1.5 transition-all" />
            {/* Buffered */}
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-white/30 transition-all"
              style={{ width: `${bufferedPct}%` }}
            />
            {/* Played */}
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-white transition-all"
              style={{ width: `${progressPct}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPct}% - 6px)` }}
            />
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between gap-2">

            {/* Left controls */}
            <div className="flex items-center gap-1">
              {/* Skip back */}
              <button
                onClick={() => handleSkip(-10)}
                className="p-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                title="Rewind 10s"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                className="p-2 text-white hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                {playing
                  ? <Pause className="w-5 h-5 fill-current" />
                  : <Play className="w-5 h-5 fill-current" />
                }
              </button>

              {/* Skip forward */}
              <button
                onClick={() => handleSkip(10)}
                className="p-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                title="Forward 10s"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Volume */}
           <div className="flex items-center gap-1.5 group/vol">
  <button
    onClick={handleMuteToggle}
    className="p-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
  >
    {muted || volume === 0
      ? <VolumeX className="w-4 h-4" />
      : <Volume2 className="w-4 h-4" />
    }
  </button>
  <div className="w-0 overflow-hidden group-hover/vol:w-16 transition-all duration-200">
    <input
      type="range"
      min={0} max={1} step={0.05}
      value={muted ? 0 : volume}
      onChange={handleVolumeChange}
      className="w-16 accent-white cursor-pointer"
    />
  </div>
</div>

              {/* Time */}
              <span className="text-white text-xs font-medium px-1 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1">

              {/* Quality */}
              {qualities.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(p => !p)}
                    className="flex items-center gap-1.5 p-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10 text-xs font-medium"
                  >
                    <Settings className={`w-4 h-4 transition-transform duration-300 ${showSettings ? "rotate-45" : ""}`} />
                    <span className="hidden sm:inline">{currentQualityLabel}</span>
                  </button>

                  {showSettings && (
                    <div className="absolute bottom-10 right-0 bg-zinc-900/95 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl min-w-[140px] border border-white/10 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest border-b border-white/10">
                        Quality
                      </div>
                      <button
                        onClick={() => handleQualityChange(-1)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
                      >
                        <span>Auto</span>
                        {currentQuality === -1 && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </button>
                      {[...qualities].reverse().map((q) => (
                        <button
                          key={q.index}
                          onClick={() => handleQualityChange(q.index)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
                        >
                          <span>{q.label}</span>
                          {currentQuality === q.index && <Check className="w-3.5 h-3.5 text-blue-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fullscreen */}
              <button
                onClick={handleFullscreen}
                className="p-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                {fullscreen
                  ? <Minimize className="w-4 h-4" />
                  : <Maximize className="w-4 h-4" />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HlsPlayer