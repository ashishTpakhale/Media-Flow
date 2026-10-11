import  { useState, useEffect } from 'react';
import { RefreshCw, Video, Upload } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/config';
import { getHeaders } from './auth';
import Header from './Header';
import StatsSection from './StatsSection';
import VideosGrid from './VideosGrid';
import EditModal from './EditModal';
import AboutModal from './AboutModal';
import EditChannelModal from './EditChannelModal';

const ChannelPage = () => {
  // --- State (Logic Unchanged) ---
  const [videos, setVideos] = useState([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [aboutData, setAboutData] = useState(null);
  const [channelId, setChannelId] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [channelData, setChannelData] = useState(null);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    visibility: "public",
    scheduledAt: "",
    tags: ""
  });

  // --- Handlers (Logic Unchanged) ---
  const handleEditClick = (video) => {
    setSelectedVideo(video);
    setThumbnailFile(null);
    setThumbnailPreview(null);

    setEditForm({
      title: video.title || "",
      description: video.description || "",
      visibility: video.visibility || "public",
      scheduledAt: video.scheduledAt
        ? new Date(video.scheduledAt).toISOString().slice(0, 16)
        : "",
      tags: video.tags?.join(", ") || ""
    });

    setEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveVideoDetails = async () => {
    try {
      setUpdating(true);

      const response = await fetch(
        `${API_BASE_URL}/videos/${selectedVideo.id}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            title: editForm.title,
            description: editForm.description,
            visibility: editForm.visibility,
            scheduledAt: editForm.scheduledAt || null
          })
        }
      );

      if (!response.ok) throw new Error("Update failed");

      alert("Video updated successfully!");
      setEditModalOpen(false);
      loadVideos();
    } catch (err) {
      console.error(err);
      alert("Failed to update video");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const fetchChannelId = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/aboutme`, {
          headers: getHeaders(),
        });
     
        const id = res.data?.data?.id;
        setChannelId(id);
      } catch (err) {
        console.error("Failed to fetch channel ID:", err);
      }
    };
    loadAboutData();
    loadSubscriberCount();
    fetchChannelId();
  }, []);

  useEffect(() => {
    if (!channelId) return;

    loadSubscriberCount();
    loadVideos();
  }, [channelId]);

  const loadSubscriberCount = async () => {
    if (!channelId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/subscribers/${channelId}`);
      const data = await response.json();

      setSubscriberCount(data.subscribers || 0);
    } catch (error) {
      console.error('Error loading subscriber count:', error);
    }
  };

  const loadVideos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/my-videos`, {
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to load videos');

      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAboutData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/aboutme`, {
        headers: getHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to load about info');
      
      const data = await response.json();
      setAboutData(data);
       setChannelData(data.data);
    } catch (error) {
      console.error('Error loading about info:', error);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateThumbnail = async (e) => {
    e.preventDefault();
    
    if (!thumbnailFile) {
      alert('Please select a thumbnail image');
      return;
    }
    
    setUpdating(true);
    
    try {
      const formData = new FormData();
      formData.append('thumbnail', thumbnailFile);
      
      const authToken = localStorage.getItem('token') || 'your-auth-token';
      const response = await fetch(`${API_BASE_URL}/thumbnail/${selectedVideo.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to update thumbnail');
      
      alert('Thumbnail updated successfully!');
      setEditModalOpen(false);
      loadVideos();
    } catch (error) {
      console.error('Error updating thumbnail:', error);
      alert('Failed to update thumbnail. Please try again.');
    } finally {
      setUpdating(false);
    }
    const det = axios.get(`${API_BASE_URL}/videos/${selectedVideo.id}`, {
        headers: getHeaders(),
        });
    
  };

  const handleRemoveThumbnail = async () => {
    if (!confirm('Are you sure you want to remove this thumbnail?')) return;
    
    setUpdating(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/thumbnail/${selectedVideo.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to remove thumbnail');
      
      alert('Thumbnail removed successfully!');
      setEditModalOpen(false);
      loadVideos();
    } catch (error) {
      console.error('Error removing thumbnail:', error);
      alert('Failed to remove thumbnail. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${videoId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to delete video');
      
      alert('Video deleted successfully!');
      loadVideos();
      loadSubscriberCount();
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video. Please try again.');
    }
  };

  const handleAboutClick = async () => {
    setAboutModalOpen(true);
    await loadAboutData();
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <Header 
        aboutData={aboutData}
        subscriberCount={subscriberCount}
        handleAboutClick={handleAboutClick}
        handleSettingsClick={() => setOpenEdit(true)}
      />

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* Stats Section */}
        <StatsSection 
          subscriberCount={subscriberCount}
          videosCount={videos.length}
        />

        {/* Videos Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Your Videos
            </h2>
            <p className="text-zinc-500 text-sm mt-1">
              Manage your content and performance metrics.
            </p>
          </div>

          <button
            onClick={loadVideos}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-white text-black font-medium hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          // Simple Loading Skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-video bg-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <Video className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-xl font-semibold text-white">No videos yet</h3>
            <p className="text-zinc-400 mt-2 max-w-sm text-center">
              Start sharing your story with the world. Upload your first video to get started.
            </p>
            <button className="mt-6 px-6 py-2.5 bg-white text-black rounded-md font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Video
            </button>
          </div>
        ) : (
          // Videos Grid
          <VideosGrid 
            loading={false}
            videos={videos}
            handleEditClick={handleEditClick}
            handleDeleteVideo={handleDeleteVideo}
          />
        )}
      </main>

      {/* Modals */}
      <EditModal 
        editModalOpen={editModalOpen}
        setEditModalOpen={setEditModalOpen}
        selectedVideo={selectedVideo}
        thumbnailPreview={thumbnailPreview}
        handleThumbnailChange={handleThumbnailChange}
        handleUpdateThumbnail={handleUpdateThumbnail}
        handleRemoveThumbnail={handleRemoveThumbnail}
        updating={updating}
        editForm={editForm}
        handleEditChange={handleEditChange}
        handleSaveVideoDetails={handleSaveVideoDetails}
      />

      <AboutModal 
        aboutModalOpen={aboutModalOpen}
        setAboutModalOpen={setAboutModalOpen}
        aboutData={aboutData}
      />

      {openEdit && (
        <EditChannelModal
          user={channelData}
          onClose={() => setOpenEdit(false)}
          onUpdated={updatedUser => setChannelData(updatedUser)}
        />
      )}
    </div>
  );
};

export default ChannelPage;