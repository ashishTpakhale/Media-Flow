const EngagementStat = ({ label, value, icon }) => {
  return (
    <div className="flex items-center gap-4 p-4 rounded-md border border-neutral-800 bg-neutral-900">
      <div className="text-neutral-400">{icon}</div>
      <div>
        <p className="text-sm text-neutral-400">{label}</p>
        <p className="text-lg font-semibold text-white">
          {value}
        </p>
      </div>
    </div>
  )
}
