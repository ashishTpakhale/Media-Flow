import {
  BarChart3,
  Pencil,
  MessageSquare,
  Globe,
  Trash2,
  X,
  MoreVertical,
  Eye,
  Lock
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import axios from "axios"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  formatNumber,
  formatDuration,
  formatDate,
} from "./formatters"
import { API_BASE_URL } from "../../../config/config"

const VideoRow = ({ video, handleEditClick, onDelete }) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)
  
  const menuRef = useRef(null)
  const firstWord = video.title.split(" ")[0]

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleDelete = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      await axios.delete(`${API_BASE_URL}/videos/${video.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      onDelete?.(video.id)
      setOpen(false)
      setConfirmText("")
    } catch (err) {
      console.error("Delete failed", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Main Row Container */}
      <div className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-black border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
        
        {/* 1. Thumbnail (Full width on mobile, fixed on desktop) */}
        <div className="relative w-full sm:w-40 aspect-video rounded-lg overflow-hidden bg-zinc-800 shrink-0">
          <img
            src={video.thumbnailUrl || "/placeholder.jpg"}
            alt={video.title}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-1 right-1 text-[10px] font-medium bg-black/80 text-white px-1.5 py-0.5 rounded">
            {formatDuration(video.duration)}
          </span>
        </div>

        {/* 2. Content Area */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h4 className="text-base font-semibold text-white truncate pr-4">
                {video.title}
              </h4>
              
              {/* Mobile Stats: Visible immediately */}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400 sm:hidden">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {formatNumber(video.views)}
                </span>
                <span>{formatDate(video.publishedAt || video.createdAt)}</span>
              </div>
            </div>

            {/* 3. Action Menu Trigger (Replaces Hover Buttons) */}
            <div className="relative shrink-0" ref={menuRef}>
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <button 
                    onClick={() => { navigate(`/studio/analytics/video/${video.id}`); setMenuOpen(false) }}
                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 border-b border-zinc-800/50"
                  >
                    <BarChart3 className="w-4 h-4" /> Analytics
                  </button>
                  <button 
                    onClick={() => { handleEditClick(video); setMenuOpen(false) }}
                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 border-b border-zinc-800/50"
                  >
                    <Pencil className="w-4 h-4" /> Edit Details
                  </button>
                  <button 
                    onClick={() => { /* Handle comments */ setMenuOpen(false) }}
                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 border-b border-zinc-800/50"
                  >
                    <MessageSquare className="w-4 h-4" /> Comments
                  </button>
                  <button 
                    onClick={() => { setOpen(true); setMenuOpen(false) }}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center gap-3"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Stats & Visibility (Hidden on mobile) */}
          <div className="hidden sm:flex items-center gap-6 mt-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> {formatNumber(video.views)} views
            </span>
            <span>{formatDate(video.publishedAt || video.createdAt)}</span>
            
            <div className="ml-auto flex items-center gap-2">
               <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                video.visibility === 'public' 
                  ? 'bg-green-900/20 text-green-400 border-green-900/50' 
                  : 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50'
              }`}>
                {video.visibility === 'public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {video.visibility.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Mobile Visibility Badge */}
          <div className="sm:hidden mt-2">
             <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                video.visibility === 'public' 
                  ? 'bg-green-900/20 text-green-400 border-green-900/50' 
                  : 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50'
              }`}>
                {video.visibility === 'public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {video.visibility.toUpperCase()}
              </span>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <DialogHeader>
            <DialogTitle className="text-lg">Delete this video?</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm text-zinc-300">
            <p>
              Type <span className="font-semibold text-white">"{firstWord}"</span> to confirm.
            </p>

            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Type "${firstWord}"`}
              className="bg-black border-zinc-700 text-white focus:border-white"
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                disabled={confirmText !== firstWord || loading}
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default VideoRow