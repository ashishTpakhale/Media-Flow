import { Link } from "react-router-dom"

const RelatedVideos = ({ videos, formatViews, formatDate }) => {
  return (
    <div className="space-y-2">
      {videos.length > 0 ? (
        videos.map(v => (
          <Link
            key={v.id}
            to={`/videos/${v.id}`}
            className="flex gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors group"
          >
            <div className="relative flex-shrink-0">
              <img
                src={v.thumbnailUrl || 'https://via.placeholder.com/168x94/333/666?text=No+Thumbnail'}
                alt={v.title}
                className="w-[168px] h-[94px] rounded-lg object-cover"
              />
              {v.duration && (
                <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
                  {v.duration}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                {v.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                {v.user?.username || 'Unknown Channel'}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <span>{formatViews(v.views || 0)} views</span>
                <span>•</span>
                <span>{formatDate(v.createdAt)}</span>
              </div>
            </div>
          </Link>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          No recommendations available
        </div>
      )}
    </div>
  )
}

export default RelatedVideos