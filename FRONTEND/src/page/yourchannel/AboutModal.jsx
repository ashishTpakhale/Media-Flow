import React, { useEffect, useState } from 'react';
import { X, Mail, Calendar, User, Loader2, Link as LinkIcon } from 'lucide-react';
import { API_BASE_URL } from '../../../config/config';

// const API_BASE_URL = "http://localhost:8000";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const AboutModal = ({ aboutModalOpen, setAboutModalOpen }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (aboutModalOpen) {
      const fetchProfile = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${API_BASE_URL}/aboutme`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          if (response.ok) {
            const result = await response.json();
            // Handle the { success: true, data: {...} } structure
            setProfile(result.data || null);
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [aboutModalOpen]);

  if (!aboutModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-all duration-300"
      onClick={() => setAboutModalOpen(false)}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header with Optional Banner Context */}
        <div className="relative sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          {/* Blurred Banner Background - Only renders if banner exists */}
          {profile?.channelBanner && (
            <div className="absolute inset-0 h-24 opacity-20 overflow-hidden">
              <img 
                src={profile.channelBanner} 
                alt="" 
                className="w-full h-full object-cover blur-sm" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950" />
            </div>
          )}

          <div className="relative flex items-center justify-between px-6 py-4">
            <h3 className="text-lg font-semibold text-white tracking-tight">
              Channel Info
            </h3>
            <button
              onClick={() => setAboutModalOpen(false)}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 lg:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-zinc-600 animate-spin mb-4" />
              <p className="text-sm text-zinc-500">Loading profile...</p>
            </div>
          ) : profile ? (
            <div className="space-y-8">
              
              {/* Profile Header Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Avatar - Optional with Fallback */}
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-zinc-800 overflow-hidden shadow-xl ring-1 ring-white/10">
                    {profile.avatarUrl ? (
                      <img 
                        src={profile.avatarUrl} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <User className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Name & Bio */}
                <div className="text-center sm:text-left space-y-2 flex-1">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {profile.displayName || "Your Channel"}
                  </h2>
                  <p className="text-sm text-zinc-400 font-medium">
                    @{profile.username || "user"}
                  </p>
                  
                  {profile.bio && (
                    <p className="text-zinc-300 leading-relaxed text-sm mt-4 max-w-lg mx-auto sm:mx-0">
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-900">
                
                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Contact Email
                  </label>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-300 font-mono break-all">
                      {profile.email || "No email provided"}
                    </span>
                  </div>
                </div>

                {/* Joined Date */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Member Since
                  </label>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-300">
                      {formatDate(profile.createdAt)}
                    </span>
                  </div>
                </div>

                {/* User ID */}
                <div className="space-y-2 md:col-span-2">
                   <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Channel ID
                  </label>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/30">
                    <LinkIcon className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-500 font-mono break-all">
                      {profile.id}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500">
              Could not load profile data.
            </div>
          )}
        </div>
        
        {/* Footer Action */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-end">
           <button 
             onClick={() => setAboutModalOpen(false)}
             className="px-6 py-2.5 rounded-lg bg-white text-black font-bold text-sm hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;