// src/components/Topbar.jsx
// Enhanced Topbar with YouTube-style search dropdown — mobile responsive

import { Menu, Search, Video, Bell, Moon, Sun, Clock, X, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  getSearchHistory,
  addSearchToHistory,
  deleteSearchFromHistory,
  clearSearchHistory,
  formatSearchTime
} from "../../searches/searchHistory"

// Mock trending searches (you can fetch from API later)
const TRENDING_SEARCHES = [
  "AI tutorials",
  "React hooks explained",
  "Best coding practices 2025",
  "JavaScript async await",
  "CSS animations"
]

const Topbar = ({
  sidebarOpen,
  setSidebarOpen,
  darkMode,
  toggleDarkMode,
  handleCreateClick,
}) => {
  const navigate = useNavigate()
  const searchInputRef = useRef(null)
  const mobileSearchInputRef = useRef(null)
  const dropdownRef = useRef(null)

  const [query, setQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [hoveredItem, setHoveredItem] = useState(null)
  // Mobile: toggle full-width search bar
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const user = JSON.parse(localStorage.getItem("user"))

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory())
  }, [])

  // Focus mobile search input when it opens
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 50)
    }
  }, [mobileSearchOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle search execution
  const handleSearch = (searchQuery = query) => {
    if (!searchQuery.trim()) return
    const updated = addSearchToHistory(searchQuery)
    setSearchHistory(updated)
    navigate(`/results?q=${encodeURIComponent(searchQuery)}`)
    setShowDropdown(false)
    setMobileSearchOpen(false)
    setQuery("")
  }



  const handleSignout = () => { 
  return () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/signin")
  }
}
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch()
    if (e.key === "Escape") setMobileSearchOpen(false)
  }


  const handleDeleteHistory = (itemQuery, e) => {
    e.stopPropagation()
    const updated = deleteSearchFromHistory(itemQuery)
    setSearchHistory(updated)
  }

  const handleClearAll = () => {
    const updated = clearSearchHistory()
    setSearchHistory(updated)
  }

  const handleHistoryClick = (itemQuery) => {
    setQuery(itemQuery)
    handleSearch(itemQuery)
  }

  // Shared search dropdown content
  const SearchDropdown = ({ inputRef, containerRef }) => (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-xl max-h-[70vh] overflow-y-auto z-50"
    >
      {searchHistory.length > 0 && (
        <div className="border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Search History</span>
            <button
              onClick={handleClearAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline uppercase font-medium"
            >
              Clear all
            </button>
          </div>
          {searchHistory.map((item, index) => (
            <div
              key={index}
              onClick={() => handleHistoryClick(item.query)}
              onMouseEnter={() => setHoveredItem(index)}
              onMouseLeave={() => setHoveredItem(null)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer group"
            >
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.query} className="w-10 h-10 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{item.query}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatSearchTime(item.timestamp)}</p>
              </div>
              {hoveredItem === index && (
                <button
                  onClick={(e) => handleDeleteHistory(item.query, e)}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!query.trim() && (
        <div>
          <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trending Searches</span>
          </div>
          {TRENDING_SEARCHES.map((trend, index) => (
            <div
              key={index}
              onClick={() => handleHistoryClick(trend)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <TrendingUp className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-900 dark:text-gray-100">{trend}</span>
            </div>
          ))}
        </div>
      )}

      {searchHistory.length === 0 && !query.trim() && (
        <div className="px-4 py-8 text-center">
          <Clock className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No search history</p>
        </div>
      )}
    </div>
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800">
      {/* ── Mobile full-width search bar (hidden on md+) ── */}
      {mobileSearchOpen && (
        <div className="flex md:hidden items-center gap-2 px-2 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setMobileSearchOpen(false); setQuery("") }}
            className="flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 items-center relative">
            <div className="flex flex-1 items-center border border-gray-300 dark:border-zinc-700 rounded-l-full">
              <Input
                ref={mobileSearchInputRef}
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowDropdown(true)}
                className="border-0 bg-transparent px-4 focus-visible:ring-0"
              />
            </div>
            <Button
              onClick={() => handleSearch()}
              className="rounded-r-full px-4 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700"
            >
              <Search className="h-4 w-4" />
            </Button>

            {showDropdown && (
              <SearchDropdown inputRef={mobileSearchInputRef} containerRef={dropdownRef} />
            )}
          </div>
        </div>
      )}

      {/* ── Main topbar row ── */}
      <div className={`flex items-center justify-between px-2 sm:px-4 py-2 ${mobileSearchOpen ? "hidden md:flex" : "flex"}`}>

        {/* Left — Menu & Logo */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <Video className="h-7 w-7 text-red-600" />
            <span className="text-xl font-semibold hidden sm:inline">StreamForge</span>
          </div>
        </div>

        {/* Center — Search Bar (desktop / tablet) */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-4 relative">
          <div className="flex flex-1 items-center border border-gray-300 dark:border-zinc-700 rounded-l-full">
            <Input
              ref={searchInputRef}
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowDropdown(true)}
              className="border-0 bg-transparent px-4 focus-visible:ring-0"
            />
          </div>
          <Button
            onClick={() => handleSearch()}
            className="rounded-r-full px-6 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700"
          >
            <Search className="h-5 w-5" />
          </Button>

          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-12 mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-xl max-h-[70vh] overflow-y-auto z-50"
            >
              {searchHistory.length > 0 && (
                <div className="border-b border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Search History</span>
                    <button
                      onClick={handleClearAll}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline uppercase font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                  {searchHistory.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleHistoryClick(item.query)}
                      onMouseEnter={() => setHoveredItem(index)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer group"
                    >
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.query} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{item.query}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatSearchTime(item.timestamp)}</p>
                      </div>
                      {hoveredItem === index && (
                        <button
                          onClick={(e) => handleDeleteHistory(item.query, e)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!query.trim() && (
                <div>
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trending Searches</span>
                  </div>
                  {TRENDING_SEARCHES.map((trend, index) => (
                    <div
                      key={index}
                      onClick={() => handleHistoryClick(trend)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <TrendingUp className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{trend}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchHistory.length === 0 && !query.trim() && (
                <div className="px-4 py-8 text-center">
                  <Clock className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No search history</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Actions & Profile */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Mobile search icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSearchOpen(true)}
            className="md:hidden"
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="hidden sm:inline-flex"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/upload")}
            className="hidden sm:inline-flex"
          >
            <Video className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                <Avatar>
                  {user?.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} />
                  ) : (
                    <AvatarFallback>
                      {user?.displayName?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{user?.displayName || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/channel")}>Your channel</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              {/* Dark mode visible in dropdown on mobile */}
              <DropdownMenuItem onClick={toggleDarkMode} className="sm:hidden">
                {darkMode ? "Light" : "Dark"} mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/upload")} className="sm:hidden">
                Upload video
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
              onClick={handleSignout()}
              >Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default Topbar