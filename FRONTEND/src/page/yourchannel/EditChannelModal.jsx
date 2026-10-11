import  { useState, useEffect } from "react"
import { X, Upload, Image as ImageIcon, User, Loader2, Check, Camera } from "lucide-react"
import axios from "axios"
import { API_BASE_URL } from "../../../config/config"

const EditChannelModal = ({ user, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
  })

  const [avatarFile, setAvatarFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  
  // Preview States
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null)
  const [bannerPreview, setBannerPreview] = useState(user?.channelBanner || null) // Adjusted key based on your memory
  
  const [loading, setLoading] = useState(false)

  // Handle Local File Previews
  useEffect(() => {
    if (avatarFile) {
      const objectUrl = URL.createObjectURL(avatarFile)
      setAvatarPreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setAvatarPreview(user?.avatarUrl || null)
    }
  }, [avatarFile, user?.avatarUrl])

  useEffect(() => {
    if (bannerFile) {
      const objectUrl = URL.createObjectURL(bannerFile)
      setBannerPreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setBannerPreview(user?.channelBanner || null)
    }
  }, [bannerFile, user?.channelBanner])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      const formData = new FormData()
      formData.append("displayName", form.displayName)
      formData.append("bio", form.bio)

      if (avatarFile) formData.append("avatar", avatarFile)
      if (bannerFile) formData.append("banner", bannerFile)

      const res = await axios.put(
        `${API_BASE_URL}/update`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      )

      onUpdated(res.data.user)
      onClose()
    } catch (error) {
      console.error("Error updating channel:", error)
      alert("Failed to update channel. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Customize Channel</h2>
            <p className="text-xs text-zinc-500">Update your public profile details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 lg:p-8 space-y-8">
          
          {/* Banner Preview Section */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Channel Banner
            </label>
            <div className="relative w-full aspect-[3/1] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 group ring-1 ring-white/5">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 bg-zinc-900/50">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs font-medium">No Banner Selected</span>
                </div>
              )}
              
              {/* Overlay Upload Button */}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                <div className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg transform hover:scale-105 transition-transform">
                  <Upload className="w-4 h-4" /> Change Banner
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBannerFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Avatar & Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            
            {/* Avatar Column */}
            <div className="flex flex-col items-center md:items-start space-y-4">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider w-full text-left md:text-center">
                Profile Picture
              </label>
              <div className="relative w-28 h-28 group mx-auto md:mx-0">
                <div className="w-full h-full rounded-full bg-zinc-900 border-2 border-zinc-800 overflow-hidden shadow-xl ring-1 ring-white/10">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-600 bg-zinc-900">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <label className="absolute inset-0 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
                  <Camera className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
              <span className="text-xs text-zinc-500 font-medium">Recommended: 400x400px</span>
            </div>

            {/* Form Fields Column */}
            <div className="md:col-span-2 space-y-6 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Channel Name
                </label>
                <input
                  name="displayName"
                  value={form.displayName}
                  onChange={handleChange}
                  placeholder="Enter channel name"
                  className="w-full px-4 py-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:border-white focus:ring-1 focus:ring-white/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Bio / Description
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell viewers about your channel..."
                  rows={4}
                  className="w-full px-4 py-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:border-white focus:ring-1 focus:ring-white/20 outline-none transition-all resize-none leading-relaxed"
                />
                <div className="flex justify-end">
                   <span className="text-[10px] text-zinc-600 font-mono">{form.bio.length} chars</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/30">
          <button
            onClick={onClose}
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-zinc-900"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-2.5 text-sm font-bold rounded-lg bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-95 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditChannelModal