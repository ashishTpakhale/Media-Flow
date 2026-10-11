import  { useEffect, useState } from "react"
import { X, Upload, Trash2, Image as ImageIcon, User, Loader2, Check } from "lucide-react"
import { API_BASE_URL } from "../../../config/config"

const EditModal = ({
  editModalOpen,
  setEditModalOpen,
  selectedVideo,
  thumbnailPreview,
  handleThumbnailChange,
  handleUpdateThumbnail,
  handleRemoveThumbnail,
  updating,
  editForm,
  handleEditChange,
  handleSaveVideoDetails,
}) => {
  const [userProfile, setUserProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
const token = localStorage.getItem("token")
  // Fetch user profile for header context
  useEffect(() => {
    if (editModalOpen) {
      const fetchProfile = async () => {
        try {
          setLoadingProfile(true)
          const response = await fetch(`${API_BASE_URL}/aboutme`,
            {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
          )
          if (response.ok) {
            const data = await response.json()
            setUserProfile(data)
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error)
        } finally {
          setLoadingProfile(false)
        }
      }
      fetchProfile()
    }
  }, [editModalOpen])

  if (!editModalOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 transition-all duration-300"
      onClick={() => setEditModalOpen(false)}
    >
      {/* Modal Container */}
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header - Matches Channel Modal Style */}
        <div className="relative flex-shrink-0 border-b border-zinc-800 bg-zinc-950">
          {/* Optional Banner Background */}
          {userProfile?.channelBanner && (
            <div className="absolute inset-0 h-24 opacity-20 overflow-hidden">
              <img 
                src={userProfile.channelBanner} 
                alt="" 
                className="w-full h-full object-cover blur-sm" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950" />
            </div>
          )}

          <div className="relative flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Optional Avatar */}
              <div className="relative">
                {userProfile?.avatarUrl ? (
                  <img 
                    src={userProfile.avatarUrl} 
                    alt="User" 
                    className="w-10 h-10 rounded-full border border-zinc-700 object-cover bg-zinc-900 shadow-lg"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-lg">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  Video Details
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  Manage metadata and thumbnails
                </p>
              </div>
            </div>

            <button
              onClick={() => setEditModalOpen(false)}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 lg:p-8 space-y-8">
            
            {/* Thumbnail Section - Matches Banner Style */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Video Thumbnail
              </label>
              <div className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 group ring-1 ring-white/5">
                {thumbnailPreview || selectedVideo.thumbnailUrl ? (
                  <img 
                    src={thumbnailPreview || selectedVideo.thumbnailUrl} 
                    alt="Thumbnail" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-600 bg-zinc-900/50">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs font-medium">No Thumbnail</span>
                  </div>
                )}
                
                {/* Overlay Upload Button */}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                  <div className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg transform hover:scale-105 transition-transform">
                    <Upload className="w-4 h-4" /> Change Thumbnail
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </label>
              </div>
              
              {/* Thumbnail Actions Row */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleUpdateThumbnail}
                  disabled={!thumbnailPreview || updating}
                  className="text-xs font-bold uppercase tracking-wider text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                </button>
                
                {selectedVideo.thumbnailUrl && (
                  <button
                    onClick={handleRemoveThumbnail}
                    disabled={updating}
                    className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1 ml-auto"
                  >
                    <Trash2 className="w-3 h-3" /> Remove Current
                  </button>
                )}
              </div>
            </div>

            {/* Main Form Grid - Matches Channel Info Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 pt-4 border-t border-zinc-900">
              
              {/* Left Side: Visual Context (Optional, or just spacing) */}
              <div className="hidden md:block md:col-span-1">
                 <div className="sticky top-0 space-y-4">
                    <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Tips:<br/>
                            • Use a high-resolution image.<br/>
                            • Keep titles under 60 characters.<br/>
                            • Schedule posts for peak hours.
                        </p>
                    </div>
                 </div>
              </div>

              {/* Right Side: Inputs */}
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Video Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    placeholder="Add a title that describes your video"
                    className="w-full px-4 py-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:border-white focus:ring-1 focus:ring-white/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    rows={5}
                    placeholder="Tell viewers about your video..."
                    className="w-full px-4 py-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:border-white focus:ring-1 focus:ring-white/20 outline-none transition-all resize-none leading-relaxed"
                  />
                   <div className="flex justify-end">
                     <span className="text-[10px] text-zinc-600 font-mono">{editForm.description?.length || 0} chars</span>
                  </div>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Visibility
                    </label>
                    <div className="relative">
                      <select
                        name="visibility"
                        value={editForm.visibility}
                        onChange={handleEditChange}
                        className="w-full appearance-none px-4 py-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white focus:border-white focus:ring-1 focus:ring-white/20 outline-none transition-all cursor-pointer"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="unlisted">Unlisted</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Schedule Publish
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduledAt"
                      value={editForm.scheduledAt}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white focus:border-white focus:ring-1 focus:ring-white/20 outline-none transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950">
          <button
            onClick={() => setEditModalOpen(false)}
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-zinc-900"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveVideoDetails}
            disabled={updating}
            className="px-8 py-2.5 text-sm font-bold rounded-lg bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-95 flex items-center gap-2"
          >
            {updating ? (
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

export default EditModal