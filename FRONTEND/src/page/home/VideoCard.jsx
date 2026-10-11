import { Card, CardContent } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"

const VideoCard = ({ video }) => {
  const navigate = useNavigate()

  return (
    <Card
      onClick={() => navigate(`/watch/${video._id}`)}
      className="border-none shadow-none cursor-pointer"
    >
      <CardContent className="p-0 space-y-2">
        {/* Thumbnail */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="object-cover w-full h-full"
          />
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {video.duration}
          </span>
        </div>

        {/* Meta */}
        <div className="flex gap-3">
          <img
            src={video.channel?.avatarUrl}
            alt={video.channel?.name}
            className="h-9 w-9 rounded-full"
          />

          <div className="text-sm">
            <p className="font-semibold line-clamp-2">{video.title}</p>
            <p className="text-muted-foreground text-xs">
              {video.channel?.name}
            </p>
            <p className="text-muted-foreground text-xs">
              {video.views} views
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default VideoCard
