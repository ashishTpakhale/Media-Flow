import { Card } from "@/components/ui/card"

export default function VideoSelector({ videos = [], selected, onSelect }) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Select Video</h2>
        <div className="text-sm text-muted-foreground">
          {videos.length} {videos.length === 1 ? "video" : "videos"}
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {videos.map(video => (
          <Card
            key={video.id}
            onClick={() => onSelect(video)}
            className={`min-w-[280px] cursor-pointer transition-all hover:shadow-lg ${
              selected?.id === video.id
                ? "ring-2 ring-primary shadow-md"
                : "hover:ring-1 hover:ring-muted-foreground/20"
            }`}
          >
            <div className="relative">
              {video.thumbnailUrl && (
                <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  {selected?.id === video.id && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">
                      Selected
                    </div>
                  )}
                </div>
              )}
              
              <div className="p-4">
                <p className="font-medium line-clamp-2 mb-2 text-sm">
                  {video.title}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {video.views?.toLocaleString() || 0} views
                  </div>
                  {video.createdAt && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(video.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}