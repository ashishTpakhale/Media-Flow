import { useEffect, useState } from "react"
import axios from "axios"

export const useVideoData = (id, token, API_BASE) => {
  const [video, setVideo] = useState(null)
  const [streamUrl, setStreamUrl] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [subscriberCount, setSubscriberCount] = useState(0)
  const [channelId, setChannelId] = useState(null)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        setLoading(true)

        const [videoRes, streamRes, recRes, likeRes] = await Promise.all([
          axios.get(`${API_BASE}/videos/${id}`),
          axios.get(`${API_BASE}/videos/stream/${id}`),
          axios.get(`${API_BASE}/videos/${id}/recommend`),
          token
            ? axios.get(`${API_BASE}/videos/${id}/likes`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
            : Promise.resolve(null),
        ])

        const videoData = videoRes.data.video ?? videoRes.data

        setVideo({
          ...videoData,
          likes: likeRes?.data?.totalLikes ?? videoData.likes,
        })

        setLiked(likeRes?.data?.likedByUser || false)
        setStreamUrl(streamRes.data.streamUrl)
        setRelated(recRes.data.videos ?? recRes.data ?? [])

        const channelIdFromVideo = videoData.user?.id
        setChannelId(channelIdFromVideo)

        if (channelIdFromVideo) {
          const [subCountRes, subCheckRes] = await Promise.all([
            axios.get(`${API_BASE}/subscribers/${channelIdFromVideo}`),
            token
              ? axios.get(`${API_BASE}/subscribe/check/${channelIdFromVideo}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                })
              : Promise.resolve(null),
          ])

          setSubscriberCount(subCountRes.data.subscribers || 0)
          setSubscribed(subCheckRes?.data?.subscribed || false)
        }
      } catch (err) {
        console.error("Watch load failed:", err)
        setVideo(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, token, API_BASE])

  return {
    video,
    setVideo,
    streamUrl,
    related,
    loading,
    liked,
    setLiked,
    disliked,
    setDisliked,
    subscribed,
    setSubscribed,
    subscriberCount,
    setSubscriberCount,
    channelId,
  }
}