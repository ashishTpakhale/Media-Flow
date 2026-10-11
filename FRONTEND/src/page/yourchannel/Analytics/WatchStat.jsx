const WatchStat = ({ label, value }) => {
  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900 py-6">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">
        {value}
      </p>
    </div>
  )
}
