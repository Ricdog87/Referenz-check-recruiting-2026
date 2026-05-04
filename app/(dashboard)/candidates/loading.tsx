export default function CandidatesLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="h-7 w-40 bg-bg-tertiary rounded mb-2" />
          <div className="h-3 w-56 bg-bg-tertiary rounded" />
        </div>
        <div className="h-10 w-44 bg-bg-tertiary rounded-full" />
      </div>

      {/* Filter bar */}
      <div className="card-md p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="h-9 max-w-md flex-1 bg-bg-tertiary rounded-full" />
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-7 w-20 bg-bg-tertiary rounded-full" />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card-md p-0 overflow-hidden">
        <div className="h-11 bg-bg-secondary border-b border-border" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-5 py-3.5 border-b border-border last:border-0 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-bg-tertiary" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-bg-tertiary rounded w-1/3" />
              <div className="h-2.5 bg-bg-tertiary rounded w-1/4" />
            </div>
            <div className="h-5 w-20 bg-bg-tertiary rounded-full" />
            <div className="h-3 w-20 bg-bg-tertiary rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
