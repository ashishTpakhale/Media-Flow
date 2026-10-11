const MetricCard = ({ title, value, icon }) => {
  return (
    <Card className="bg-black border-neutral-800">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="p-3 rounded-md bg-neutral-900 text-neutral-300">
          {icon}
        </div>
        <div>
          <p className="text-sm text-neutral-400">{title}</p>
          <p className="text-xl font-semibold text-white">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
