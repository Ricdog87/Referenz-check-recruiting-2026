import Link from 'next/link'
import { Home, LayoutDashboard, Search, ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.16), transparent 60%)', filter: 'blur(80px)' }} />
        <div className="absolute inset-0 grid-bg grid-bg-mask opacity-40" />
      </div>

      <div className="text-center max-w-lg relative">
        <div className="text-[120px] leading-none font-black tracking-tighter text-gradient-brand mb-2"
          style={{ fontFeatureSettings: '"tnum"' }}>
          404
        </div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-3">Seite nicht gefunden</h1>
        <p className="text-text-secondary mb-8 leading-relaxed">
          Diese Seite existiert nicht oder wurde verschoben. Hier sind ein paar Stellen,
          die Ihnen vermutlich weiterhelfen:
        </p>

        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          <Link
            href="/"
            className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-white hover:border-brand-300 hover:shadow-card transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <Home className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-text-primary">Startseite</div>
          </Link>
          <Link
            href="/dashboard"
            className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-white hover:border-brand-300 hover:shadow-card transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-text-primary">Dashboard</div>
          </Link>
          <Link
            href="/demo"
            className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-white hover:border-brand-300 hover:shadow-card transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <Search className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-text-primary">Live-Demo</div>
          </Link>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          Zurück zur Startseite <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <p className="text-[11px] text-text-muted mt-3">
          Falls Sie eine bestimmte Seite erwarten, schreiben Sie kurz an{' '}
          <a href="mailto:support@candiq.de" className="underline hover:text-text-secondary">support@candiq.de</a>.
        </p>
      </div>
    </div>
  )
}
