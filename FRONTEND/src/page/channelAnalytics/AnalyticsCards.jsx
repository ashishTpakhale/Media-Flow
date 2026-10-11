import { Card, CardContent } from "@/components/ui/card"

export default function AnalyticsCards({ analytics }) {
  const stats = [
    { label: "Views", value: analytics.totalViews },
    { label: "Watch Time (hrs)", value: analytics.watchTime },
    { label: "Likes", value: analytics.likes },
    { label: "Avg View Duration", value: analytics.avgViewDuration }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(stat => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
