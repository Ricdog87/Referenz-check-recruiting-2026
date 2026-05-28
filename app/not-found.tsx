import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main" className="min-h-screen bg-white flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.16), transparent 60%)', filter: 'blur(80px)' }} />
      </div>
      <div className="text-center max-w-md relative">
        <div className="text-8xl font-black tracking-tighter text-gradient-brand mb-2" style={{ fontFeatureSettings: '"tnum"' }}>
          404
        </div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-3">Seite nicht gefunden</h1>
        <p className="text-text-secondary mb-8">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="flex gap-2 justify-center">
          <Link href="/" className="btn-primary">Zur Startseite</Link>
          <Link href="/dashboard" className="btn-secondary">Zum Dashboard</Link>
        </div>
      </div>
    </main>
  )
}
