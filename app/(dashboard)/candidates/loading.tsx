export default function CandidatesLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-12 bg-bg-secondary rounded-lg max-w-sm" />
      <div className="card p-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 bg-bg-secondary border-b border-border last:border-0" />
        ))}
      </div>
    </div>
  )
}
