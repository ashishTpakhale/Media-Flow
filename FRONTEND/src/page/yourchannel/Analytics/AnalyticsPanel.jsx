import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Eye,
  Clock,
  ThumbsUp,
  MessageSquare,
  UserPlus,
} from "lucide-react"

const MetricCard = ({ title, value, icon }) => (
  <Card className="bg-neutral-900 border-neutral-800">
    <CardContent className="p-5 flex items-center gap-4">
      <div className="p-3 rounded-md bg-black border border-neutral-800 text-neutral-300">
        {icon}
      </div>
      <div>
        <p className="text-xs text-neutral-400 uppercase tracking-wide">
          {title}
        </p>
        <p className="text-2xl font-semibold text-white">
          {value ?? "—"}
        </p>
      </div>
    </CardContent>
  </Card>
)

const WatchStat = ({ label, value }) => (
  <div className="rounded-md border border-neutral-800 bg-neutral-900 py-6">
    <p className="text-xs text-neutral-400 uppercase tracking-wide">
      {label}
    </p>
    <p className="mt-1 text-2xl font-semibold text-white">
      {value ?? 0}
    </p>
  </div>
)

const EngagementStat = ({ label, value, icon }) => (
  <div className="flex items-center gap-4 p-4 rounded-md border border-neutral-800 bg-neutral-900">
    <div className="text-neutral-400">{icon}</div>
    <div>
      <p className="text-xs text-neutral-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-lg font-semibold text-white">
        {value ?? 0}
      </p>
    </div>
  </div>
)

const AnalyticsPanel = ({ analytics }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Video analytics
        </h1>
        <p className="mt-1 text-sm text-neutral-400 truncate max-w-3xl">
          {analytics.title}
        </p>
      </div>

      {/* Overview */}
      <section>
        <h2 className="text-sm text-neutral-400 mb-3 uppercase tracking-wide">
          Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Views" value={analytics.views} icon={<Eye />} />
          <MetricCard
            title="Watch time (hours)"
            value={analytics.watchTimeHours}
            icon={<Clock />}
          />
          <MetricCard
            title="Subscribers"
            value={analytics.subscribersGained}
            icon={<UserPlus />}
          />
          <MetricCard title="Likes" value={analytics.likes} icon={<ThumbsUp />} />
        </div>
      </section>

      {/* Watch Time */}
      <section>
        <Card className="bg-black border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Watch time
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <WatchStat label="Seconds" value={analytics.watchTimeSeconds} />
            <WatchStat label="Minutes" value={analytics.watchTimeMinutes} />
            <WatchStat label="Hours" value={analytics.watchTimeHours} />
          </CardContent>
        </Card>
      </section>

      {/* Engagement */}
      <section>
        <Card className="bg-black border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <EngagementStat
              label="Likes"
              value={analytics.likes}
              icon={<ThumbsUp />}
            />
            <EngagementStat
              label="Comments"
              value={analytics.comments}
              icon={<MessageSquare />}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default AnalyticsPanel
