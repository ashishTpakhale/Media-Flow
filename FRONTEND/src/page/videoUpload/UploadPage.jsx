import { useState, useRef, useEffect } from "react"
import axios from "axios"
import { UploadCloud, X, Check, Loader2, AlertCircle } from "lucide-react"
import { socket, connectSocket, disconnectSocket } from "../../lib/socket"
import { API_BASE_URL } from "../../../config/config"

const BASE_URL = `${API_BASE_URL}/videos`

const VideoUpload = () => {
  /* ---------------- STATE ---------------- */
  const [video, setVideo] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(null)
  const [videoId, setVideoId] = useState(null)
  const [uploadPhase, setUploadPhase] = useState("idle") // idle, uploading, processing, complete, failed
const videoIdRef = useRef(null)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme")
    return saved ? saved === "dark" : true
  })

  /* ---------------- REFS ---------------- */
  const videoRef = useRef()
  const thumbRef = useRef()
  const xhrRef = useRef()

  const token = localStorage.getItem("token")

  /* ---------------- DARK MODE SYNC ---------------- */
  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [darkMode])

  /* ---------------- WEBSOCKET SETUP ---------------- */
  useEffect(() => {
    if (token) {
      connectSocket()

      socket.on("video:update", (data) => {
        
        if (data.videoId === videoIdRef.current) {
          // Update progress from server (if provided)
          if (data.uploadProgress !== undefined) {
            setProgress(data.uploadProgress)
          }

          // Update status based on video processing status
          if (data.status) {
            
            if (data.status === "UPLOADING") {
              setUploadPhase("uploading")
              setStatus("Uploading to server...")
            } else if (data.status === "PROCESSING") {
  setUploadPhase("processing")
 if (data.processingProgress !== undefined) {
    setProgress(data.processingProgress)
  }

  const stageLabels = {
    DOWNLOAD:  "Downloading from storage... 20%",
    TRANSCODE: "Transcoding to HLS... 70%",
    UPLOAD:    "Uploading processed files... 90%",
    FINALIZE:  "Finalizing... 100%",
  }
  setStatus(stageLabels[data.processingStage] || "Processing video...")
} else if (data.status === "READY") {
              setUploadPhase("complete")
              setStatus(" Video uploaded and processed successfully!")
              setTimeout(() => {
                reset()
              }, 3000)
            } else if (data.status === "FAILED") {
              setUploadPhase("failed")
              setStatus("❌ Video processing failed. Please try again.")
              setUploading(false)
            }
          }
        }
      })

      socket.on("connect", () => {
      })

      socket.on("disconnect", () => {
      })

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error)
      })

      return () => {
        socket.off("video:update")
        socket.off("connect")
        socket.off("disconnect")
        socket.off("connect_error")
        disconnectSocket()
      }
    }
  }, [token, videoId])

  /* ---------------- HELPERS ---------------- */
  const formatSize = (bytes) =>
    `${(bytes / (1024 * 1024)).toFixed(2)} MB`

  /* ---------------- VIDEO SELECT ---------------- */
  const handleVideo = (file) => {
    if (!file?.type.startsWith("video/")) {
      setStatus("⚠️ Please select a valid video file")
      return
    }
    setVideo(file)
    setStatus(null)
    setUploadPhase("idle")
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""))
    }
  }

  /* ---------------- THUMBNAIL ---------------- */
  const handleThumbnail = (file) => {
    if (!file?.type.startsWith("image/")) {
      setStatus("⚠️ Please select a valid image file")
      return
    }
    setThumbnail(file)
    const reader = new FileReader()
    reader.onload = e => setThumbnailPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  /* ---------------- UPLOAD TO S3 WITH PROGRESS REPORTING ---------------- */
  const uploadToS3 = (url, file, videoId) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr

      let lastReportedProgress = 0

      xhr.upload.onprogress = async (e) => {
        if (e.lengthComputable) {
          const progressPercent = Math.round((e.loaded / e.total) * 100)
          
          // Always update local UI immediately
          setProgress(progressPercent)
          

          // Report to backend every 5% or at 100%
          if (
            (progressPercent >= lastReportedProgress + 5 || progressPercent === 100) &&
            progressPercent !== lastReportedProgress
          ) {
            lastReportedProgress = progressPercent
            try {
              await axios.put(
                `${BASE_URL}/upload/progress/${videoId}`,
                { progress: progressPercent },
                { headers: { Authorization: `Bearer ${token}` } }
              )
            } catch (err) {
              console.error("⚠️ Progress report failed:", err)
              // Don't fail the upload if progress reporting fails
            }
          }
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          console.error("❌ Upload failed with status:", xhr.status)
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }
      
      xhr.onerror = () => {
        console.error("❌ Network error during upload")
        reject(new Error("Network error during upload"))
      }
      
      xhr.onabort = () => {
        reject(new Error("Upload cancelled"))
      }

      xhr.open("PUT", url)
      xhr.setRequestHeader("Content-Type", file.type)
      xhr.send(file)
    })

  /* ---------------- SUBMIT ---------------- */
  const submit = async (e) => {
    e.preventDefault()
    if (!video || !title.trim()) {
      setStatus("⚠️ Please select a video and enter a title")
      return
    }

    try {
      setUploading(true)
      setProgress(0)
      setUploadPhase("uploading")
      setStatus("Initializing upload...")

      // Step 1: Initialize upload
      const form = new FormData()
      form.append("title", title.trim())
      form.append("description", description.trim())
      form.append("fileSize", video.size)
      form.append("mimeType", video.type)
      form.append("originalName", video.name)
      if (thumbnail) form.append("thumbnail", thumbnail)

      const init = await axios.post(
        `${BASE_URL}/upload/init`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const { videoId: newVideoId, uploadUrl } = init.data
      setVideoId(newVideoId)
      videoIdRef.current = newVideoId
      
      setStatus("Uploading to cloud storage...")

      // Step 2: Upload to S3 with progress tracking
      await uploadToS3(uploadUrl, video, newVideoId)

      setStatus("Finalizing upload...")
      setProgress(100)

      // Step 3: Complete upload
      await axios.post(
        `${BASE_URL}/upload/complete`,
        { videoId: newVideoId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setUploadPhase("processing")
      setStatus("Processing video... This may take a few minutes.")
      
      // WebSocket will handle further status updates

    } catch (err) {
      console.error("❌ Upload error:", err)
      setUploadPhase("failed")
      setStatus(err.message || "❌ Upload failed. Please try again.")
      setUploading(false)
      setProgress(0)
    }
  }

  /* ---------------- RESET ---------------- */
  const reset = () => {
    setVideo(null)
    setThumbnail(null)
    setThumbnailPreview(null)
    setTitle("")
    setDescription("")
    setProgress(0)
    setUploading(false)
    setStatus(null)
    setVideoId(null)
    setUploadPhase("idle")
    if (videoRef.current) videoRef.current.value = ""
    if (thumbRef.current) thumbRef.current.value = ""
  }

  /* ---------------- CANCEL ---------------- */
  const cancel = () => {
    if (xhrRef.current) {
      xhrRef.current.abort()
    }
    setUploadPhase("failed")
    setStatus("Upload cancelled")
    setTimeout(reset, 1500)
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen px-4 py-0 sm:px-6 lg:px-8 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <header className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent">
              Upload Video
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Share your content with the world
            </p>
          </div>

          <button
            onClick={() => setDarkMode(prev => !prev)}
            className="group relative px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 
                     bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 
                     transition-all duration-200 shadow-sm hover:shadow"
            aria-label="Toggle theme"
          >
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </span>
          </button>
        </header>

        <form
          onSubmit={submit}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 
                   rounded-2xl p-6 sm:p-8 space-y-6 shadow-lg transition-colors duration-300"
        >

          {/* VIDEO PICKER */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              Video File
            </label>
            <div
              onClick={() => !uploading && videoRef.current.click()}
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
                       ${video 
                         ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' 
                         : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50 dark:bg-neutral-950/50'
                       }
                       ${uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900/50'}`}
            >
              {video ? (
                <div className="flex flex-col items-center">
                  <Check className="mb-3 text-emerald-600 dark:text-emerald-400" size={40} strokeWidth={2.5} />
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {video.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {formatSize(video.size)}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="mb-3 text-neutral-400 dark:text-neutral-500" size={40} strokeWidth={1.5} />
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Click to select video
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    MP4, MOV, AVI • Max 5GB
                  </p>
                </div>
              )}
              <input
                ref={videoRef}
                type="file"
                accept="video/*"
                hidden
                disabled={uploading}
                onChange={e => handleVideo(e.target.files[0])}
              />
            </div>
          </div>

          {/* TITLE */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Title *
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={uploading}
              placeholder="Enter video title..."
              className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 
                       rounded-lg px-4 py-3 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600
                       focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 
                       focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={uploading}
              rows={4}
              placeholder="Tell viewers about your video..."
              className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 
                       rounded-lg px-4 py-3 text-sm resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600
                       focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 
                       focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* THUMBNAIL */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Thumbnail (Optional)
            </label>
            <div className="flex items-start gap-4">
              <input
                ref={thumbRef}
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={e => handleThumbnail(e.target.files[0])}
                className="flex-1 text-sm text-neutral-600 dark:text-neutral-400
                         file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                         file:text-sm file:font-medium file:cursor-pointer
                         file:bg-neutral-100 dark:file:bg-neutral-800 
                         file:text-neutral-700 dark:file:text-neutral-300
                         hover:file:bg-neutral-200 dark:hover:file:bg-neutral-700
                         file:transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {thumbnailPreview && (
                <div className="relative group">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-32 h-18 object-cover rounded-lg border border-neutral-300 dark:border-neutral-700"
                  />
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnail(null)
                        setThumbnailPreview(null)
                        if (thumbRef.current) thumbRef.current.value = ""
                      }}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white 
                               opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* PROGRESS BAR - Enhanced with better visual feedback */}
          {uploading && (
            <div className="space-y-3 p-5 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950/50 dark:to-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {uploadPhase === "processing" ? (
                    <div className="relative">
                      <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={20} strokeWidth={2.5} />
                      <div className="absolute inset-0 animate-ping">
                        <Loader2 className="text-blue-600/30 dark:text-blue-400/30" size={20} strokeWidth={2.5} />
                      </div>
                    </div>
                  ) : (
                    <Loader2 className="animate-spin text-neutral-600 dark:text-neutral-400" size={20} strokeWidth={2.5} />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {uploadPhase === "uploading" && progress < 100 && "Uploading..."}
                      {uploadPhase === "uploading" && progress === 100 && "Upload Complete!"}
                      {uploadPhase === "processing" && "Processing Video..."}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {uploadPhase === "uploading" && "This may take a few moments"}
                      {uploadPhase === "processing" && "Converting and optimizing"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                    {progress}%
                  </p>
                  {video && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {formatSize(video.size)}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Progress bar with animation */}
              <div className="relative h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    uploadPhase === "processing"
                      ? "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-pulse"
                      : "bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-300"
                  }`}
                  style={{ width: `${progress}%` }}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                       style={{ 
                         backgroundSize: '200% 100%',
                         animation: 'shimmer 2s infinite'
                       }} 
                  />
                </div>
              </div>

              {/* Upload speed indicator (optional) */}
              {uploadPhase === "uploading" && progress > 0 && progress < 100 && (
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span>Uploading to cloud storage</span>
                  <span className="font-mono">{progress}/100</span>
                </div>
              )}
            </div>
          )}

          {/* STATUS MESSAGE - Enhanced with better styling */}
          {status && (
            <div className={`p-4 rounded-xl border-2 ${
              uploadPhase === "failed"
                ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                : uploadPhase === "complete"
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                : 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
            }`}>
              <p className={`text-sm font-medium flex items-center gap-2 ${
                uploadPhase === "failed"
                  ? 'text-red-700 dark:text-red-400'
                  : uploadPhase === "complete"
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-blue-700 dark:text-blue-400'
              }`}>
                {uploadPhase === "complete" && <Check size={18} strokeWidth={2.5} />}
                {uploadPhase === "failed" && <AlertCircle size={18} strokeWidth={2.5} />}
                {uploadPhase === "uploading" && <Loader2 className="animate-spin" size={18} strokeWidth={2.5} />}
                {uploadPhase === "processing" && <Loader2 className="animate-spin" size={18} strokeWidth={2.5} />}
                {status}
              </p>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={cancel}
              disabled={!uploading || uploadPhase === "processing"}
              className="px-6 py-2.5 text-sm font-medium rounded-lg
                       bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300
                       hover:bg-neutral-200 dark:hover:bg-neutral-700 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!video || !title.trim() || uploading}
              className="px-8 py-2.5 text-sm font-medium rounded-lg
                       bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900
                       hover:bg-neutral-800 dark:hover:bg-neutral-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 shadow-sm hover:shadow-md
                       flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  Upload Video
                </>
              )}
            </button>
          </div>

        </form>
      </div>
      {/* Add shimmer animation CSS */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}

export default VideoUpload