export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* WelcomeBar skeleton — gradient block matching real layout */}
      <div className="rounded-3xl mb-6 p-8 bg-gradient-to-br from-brand-200/40 via-brand-300/40 to-violet/30 h-48" />

      {/* Onboarding hint skeleton */}
      <div className="card-lg h-32 bg-bg-secondary/60" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card-md h-32">
            <div className="w-10 h-10 rounded-xl bg-bg-tertiary mb-3" />
            <div className="h-7 bg-bg-tertiary rounded mb-2 w-16" />
            <div className="h-3 bg-bg-tertiary rounded w-24" />
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-md h-72">
          <div className="h-4 w-24 bg-bg-tertiary rounded mb-2" />
          <div className="h-3 w-16 bg-bg-tertiary rounded mb-6" />
          <div className="h-48 bg-bg-tertiary/50 rounded-lg" />
        </div>
        <div className="card-md h-72">
          <div className="h-4 w-32 bg-bg-tertiary rounded mb-2" />
          <div className="h-3 w-20 bg-bg-tertiary rounded mb-6" />
          <div className="h-48 bg-bg-tertiary/50 rounded-full mx-8" />
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card-md h-64">
            <div className="h-4 w-32 bg-bg-tertiary rounded mb-4" />
            <div className="space-y-3">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-bg-tertiary flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-bg-tertiary rounded w-3/4" />
                    <div className="h-2 bg-bg-tertiary rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
