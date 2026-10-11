import axios from "axios"

const API_BASE = `http://localhost:${import.meta.env.VITE_BACKEND_PORT}/api`

export const getWatchData = (id, token) =>
  Promise.all([
    axios.get(`${API_BASE}/videos/${id}`),
    axios.get(`${API_BASE}/videos/stream/${id}`),
    axios.get(`${API_BASE}/videos/${id}/recommend`),
    token
      ? axios.get(`${API_BASE}/videos/${id}/likes`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      : Promise.resolve(null),
  ])

export const likeVideo = (id, token) =>
  axios.post(
    `${API_BASE}/videos/like/${id}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  )

export const unlikeVideo = (id, token) =>
  axios.delete(`${API_BASE}/videos/like/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

/* ✅ ADD THIS */
export const getVideoLikes = (id, token) =>
  axios.get(`${API_BASE}/videos/${id}/likes`, {
    headers: { Authorization: `Bearer ${token}` },
  })
