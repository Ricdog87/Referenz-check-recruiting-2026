export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-16 bg-bg-secondary rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card h-24 bg-bg-secondary" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card h-64 bg-bg-secondary" />
        <div className="card h-64 bg-bg-secondary" />
      </div>
    </div>
  )
}
