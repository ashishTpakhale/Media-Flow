export const formatNumber = (num) => {
  if (num === null || num === undefined) return "—"

  const value = Number(num)
  if (Number.isNaN(value)) return "—"

  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M"
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "K"
  return value.toString()
}

export const formatDuration = (seconds = 0) => {
  if (!seconds && seconds !== 0) return "0:00"

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export const formatDate = (dateString) => {
  if (!dateString) return "—"

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return "—"

  const now = new Date()
  const diffTime = now - date
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}
