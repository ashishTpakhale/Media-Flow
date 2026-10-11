import { Edit, Trash2 } from 'lucide-react';
import { formatNumber, formatDate } from './formatters';

const VideoCard = ({ video, index, handleEditClick, handleDeleteVideo }) => {
  return (
    <div
      className="group bg-slate-800/50 backdrop-blur rounded-xl overflow-hidden border border-slate-700/50 hover:border-pink-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-pink-500/20"
      style={{
        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
            🎬
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button
            onClick={() => handleEditClick(video)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-all shadow-lg transform hover:scale-105"
          >
            <Edit className="w-4 h-4" />
            <span className="font-medium">Edit</span>
          </button>
          <button
            onClick={() => handleDeleteVideo(video.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500 border border-red-500 hover:border-red-400 transition-all shadow-lg transform hover:scale-105"
          >
            <Trash2 className="w-4 h-4" />
            <span className="font-medium">Delete</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-pink-300 transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span className="font-mono">{formatNumber(video.views || 0)} views</span>
          <span>•</span>
          <span>{formatDate(video.createdAt)}</span>
        </div>
        {video.description && (
          <p className="mt-2 text-sm text-slate-400 line-clamp-2">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoCard;