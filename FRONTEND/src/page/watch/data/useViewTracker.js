import { useEffect, useRef } from "react"
import axios from "axios"

export const useViewTracking = (id, token, API_BASE) => {
  const watchStartRef = useRef(null)
  const totalWatchedRef = useRef(0)      // accumulated seconds actually watched
  const sentViewRef = useRef(false)
  const viewIntervalRef = useRef(null)
  const periodicRef = useRef(null)
  const lastSentRef = useRef(0)

  // Call this when video PLAYS
  const onVideoPlay = () => {
    watchStartRef.current = Date.now()
  }

  // Call this when video PAUSES — accumulate time
  const onVideoPause = () => {
    if (watchStartRef.current) {
      totalWatchedRef.current += Math.floor((Date.now() - watchStartRef.current) / 1000)
      watchStartRef.current = null
    }
  }

  const getWatchDuration = () => {
    const current = watchStartRef.current
      ? Math.floor((Date.now() - watchStartRef.current) / 1000)
      : 0
    return totalWatchedRef.current + current
  }

  const sendWatchTimeUpdate = async (duration, force = false) => {
    if (!token || !id || duration === 0) return
    if (!force && duration === lastSentRef.current) return
    if (duration - lastSentRef.current < 5 && !force) return // min 5s difference

    lastSentRef.current = duration
    try {
      await axios.post(
        `${API_BASE}/videos/${id}/view`,
        { watchDuration: duration },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (err) {
      console.error("Failed to update watch time:", err.message)
    }
  }

  // Only called once after 20s of actual playback
  const sendView = async (duration) => {
    if (sentViewRef.current || !token || !id) return
    sentViewRef.current = true
    try {
      await axios.post(
        `${API_BASE}/videos/${id}/view`,
        { watchDuration: duration },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      lastSentRef.current = duration
    } catch (err) {
      console.error("Failed to record view:", err.message)
      sentViewRef.current = false
    }
  }

  useEffect(() => {
    if (!id || !token) return

    // Reset everything for new video
    watchStartRef.current = null
    totalWatchedRef.current = 0
    sentViewRef.current = false
    lastSentRef.current = 0

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onVideoPause()
        const duration = getWatchDuration()
        if (duration > 0) sendWatchTimeUpdate(duration, true)
      }
    }

    const handleBeforeUnload = () => {
      onVideoPause()
      const duration = getWatchDuration()
      if (duration > 0 && token && id) {
        const blob = new Blob(
          [JSON.stringify({ watchDuration: duration })],
          { type: "application/json" }
        )
        navigator.sendBeacon(`${API_BASE}/videos/${id}/view`, blob)
      }
    }

    // Periodic update every 30s — only if video is actually playing
    periodicRef.current = setInterval(() => {
      if (watchStartRef.current && !document.hidden) {
        const duration = getWatchDuration()
        if (duration > 0) sendWatchTimeUpdate(duration)
      }
    }, 30000)

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      // Final send only if something was actually watched
      onVideoPause()
      const finalDuration = getWatchDuration()
      if (finalDuration > 0) sendWatchTimeUpdate(finalDuration, true)

      clearTimeout(viewIntervalRef.current)
      clearInterval(periodicRef.current)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [id, token])

  return {
    watchStartRef,
    sentViewRef,
    viewIntervalRef,
    onVideoPlay,
    onVideoPause,
    sendView,
    sendWatchTimeUpdate,
    getWatchDuration,
  }
}