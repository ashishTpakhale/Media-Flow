import axios from "axios"
import { useNavigate } from "react-router-dom"

export const useVideoActions = (
  id,
  token,
  API_BASE,
  liked,
  setLiked,
  disliked,
  setDisliked,
  subscribed,
  setSubscribed,
  subscriberCount,
  setSubscriberCount,
  channelId,
  video,
  setVideo
) => {
  const navigate = useNavigate  ()
  const refreshVideoLikes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/videos/${id}/likes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setLiked(res.data.likedByUser)
      setVideo(prev => ({
        ...prev,
        likes: res.data.totalLikes,
      }))
    } catch (err) {
      console.error("Failed to refresh likes:", err)
    }
  }

  const handleLike = async () => {
    if (!token) {
      navigate('/signin')
      return
    }

    try {
      if (liked) {
        await axios.delete(`${API_BASE}/videos/like/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setLiked(false)
        setVideo(prev => ({
          ...prev,
          likes: Math.max((prev.likes || 1) - 1, 0),
        }))
      } else {
        await axios.post(
          `${API_BASE}/videos/like/${id}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        setLiked(true)
        setDisliked(false)
        setVideo(prev => ({
          ...prev,
          likes: (prev.likes || 0) + 1,
        }))
      }
      await refreshVideoLikes()
    } catch (err) {
      console.error("Like action failed:", err)
    }
  }

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false)
    } else {
      setDisliked(true)
      setLiked(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    alert("Link copied to clipboard!")
  }

  const handleSubscribe = async () => {
    if (!token || !channelId) {
         navigate('/signin')
      return
    }

    try {
      if (subscribed) {
        await axios.delete(`${API_BASE}/subscribe/${channelId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setSubscribed(false)
        setSubscriberCount(prev => Math.max(prev - 1, 0))
      } else {
        await axios.post(
          `${API_BASE}/subscribe/${channelId}`,
          {
            videoId: id,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        setSubscribed(true)
        setSubscriberCount(prev => prev + 1)
      }
    } catch (err) {
      console.error("Subscription action failed:", err)
    }
  }

  return {
    handleLike,
    handleDislike,
    handleShare,
    handleSubscribe,
  }
}