export default function ChecksLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-bg-tertiary rounded mb-2" />
          <div className="h-3 w-40 bg-bg-tertiary rounded" />
        </div>
        <div className="h-10 w-36 bg-bg-tertiary rounded-full" />
      </div>
      <div className="card-md p-3 flex flex-wrap gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-7 w-24 bg-bg-tertiary rounded-full" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card-md h-40">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-bg-tertiary" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-bg-tertiary rounded w-2/3" />
                <div className="h-2.5 bg-bg-tertiary rounded w-1/2" />
              </div>
            </div>
            <div className="h-3 bg-bg-tertiary rounded w-1/3 mb-3" />
            <div className="border-t border-border pt-3 flex justify-between">
              <div className="h-4 w-16 bg-bg-tertiary rounded-full" />
              <div className="h-3 w-20 bg-bg-tertiary rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
