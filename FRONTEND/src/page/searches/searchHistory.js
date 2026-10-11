// src/utils/searchHistory.js
// Manages search history in localStorage

const SEARCH_HISTORY_KEY = "yt_search_history"
const MAX_HISTORY_ITEMS = 10

/**
 * Get all search history items
 * @returns {Array} Array of search history objects
 */
export const getSearchHistory = () => {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.error("Failed to load search history:", error)
    return []
  }
}

/**
 * Add a new search to history
 * @param {string} query - Search query
 * @param {string} thumbnailUrl - Optional thumbnail URL
 */
export const addSearchToHistory = (query, thumbnailUrl = null) => {
  if (!query.trim()) return

  try {
    const history = getSearchHistory()
    
    // Remove duplicate if exists
    const filtered = history.filter(item => 
      item.query.toLowerCase() !== query.toLowerCase()
    )

    // Add new search at the beginning
    const newItem = {
      query: query.trim(),
      timestamp: new Date().toISOString(),
      thumbnailUrl
    }

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
    
    return updated
  } catch (error) {
    console.error("Failed to save search history:", error)
    return getSearchHistory()
  }
}

/**
 * Delete a specific search from history
 * @param {string} query - Query to delete
 */
export const deleteSearchFromHistory = (query) => {
  try {
    const history = getSearchHistory()
    const filtered = history.filter(item => item.query !== query)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.error("Failed to delete search:", error)
    return getSearchHistory()
  }
}

/**
 * Clear all search history
 */
export const clearSearchHistory = () => {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
    return []
  } catch (error) {
    console.error("Failed to clear search history:", error)
    return getSearchHistory()
  }
}

/**
 * Format timestamp to relative time
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time like "2 hours ago"
 */
export const formatSearchTime = (timestamp) => {
  const now = new Date()
  const past = new Date(timestamp)
  const diffMs = now - past
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return past.toLocaleDateString()
}