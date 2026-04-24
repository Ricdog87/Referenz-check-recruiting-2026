import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold font-mono text-accent/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-text-primary mb-3">Seite nicht gefunden</h1>
        <p className="text-text-secondary mb-8">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>
        <Link href="/dashboard" className="btn-primary">
          Zum Dashboard
        </Link>
      </div>
    </div>
  )
}
