export default function SettingsLoading() {
  return (
    <div className="p-6 max-w-2xl space-y-6 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card space-y-4">
          <div className="h-5 w-32 bg-bg-secondary rounded" />
          <div className="h-10 bg-bg-secondary rounded-xl" />
          <div className="h-10 bg-bg-secondary rounded-xl" />
          <div className="h-9 w-32 bg-bg-secondary rounded-full" />
        </div>
      ))}
    </div>
  )
}
