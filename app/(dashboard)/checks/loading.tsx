export default function ChecksLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-bg-secondary rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card h-20 bg-bg-secondary" />
        ))}
      </div>
    </div>
  )
}
