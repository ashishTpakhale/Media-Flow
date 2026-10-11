import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import { Card } from "@/components/ui/card"

export default function WatchTimeChart({ data }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Watch Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="watchTime" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
