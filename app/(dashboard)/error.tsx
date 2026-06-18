'use client'

// Dashboard-spezifische Error-Boundary. Faengt jeden Render-Fehler innerhalb
// von /(dashboard)/* ab und haelt die App-Chrome (Sidebar, TopBar) im DOM —
// statt dass der Root-error.tsx die komplette Seite weiss-schaltet.
//
// Hintergrund (Andre Sola, Juni 2026): Prospect-Account ist nach Login auf
// /dashboard auf die Root-error.tsx geflogen. Eine eigene Boundary hier
// reduziert den Blast-Radius auf den Inhaltsbereich und gibt einen
// nuetzbaren "Erneut versuchen"-CTA.
import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface das Detail in der Browser-Console für Support-Tickets;
    // der digest ist die Server-seitige Korrelations-ID.
    console.error('[dashboard:error]', error, { digest: error.digest })
  }, [error])

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-10">
      <div className="card-lg max-w-2xl mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-5 text-rose-600">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
          Etwas ist schiefgelaufen
        </h1>
        <p className="text-sm text-text-secondary mb-6 leading-relaxed max-w-md mx-auto">
          Beim Laden Ihres Dashboards ist ein Fehler aufgetreten. Bitte
          versuchen Sie es erneut. Wenn das Problem bestehen bleibt, melden
          Sie sich kurz ab und wieder an — oder kontaktieren Sie uns unter{' '}
          <a href="mailto:hello@candiq.de" className="text-brand-700 underline hover:text-brand-800">
            hello@candiq.de
          </a>
          .
        </p>

        {error.digest && (
          <div className="inline-block text-[11px] font-mono text-text-muted bg-bg-secondary border border-border rounded-full px-3 py-1 mb-6">
            Fehler-ID: {error.digest}
          </div>
        )}

        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={reset} className="btn-primary inline-flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" />
            Erneut versuchen
          </button>
          <Link href="/" className="btn-secondary text-sm">
            Zur Startseite
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="btn-ghost inline-flex items-center gap-2 text-sm text-text-secondary hover:text-rose-600"
          >
            <LogOut className="w-4 h-4" />
            Abmelden & neu einloggen
          </button>
        </div>
      </div>
    </div>
  )
}
