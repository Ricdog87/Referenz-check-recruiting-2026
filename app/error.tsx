'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('app_error_boundary', error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(244,63,94,0.10), transparent 60%)', filter: 'blur(80px)' }} />
      </div>

      <div className="text-center max-w-lg relative">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-5 text-rose-600 shadow-card">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-3">Etwas ist schiefgelaufen</h1>
        <p className="text-text-secondary mb-2 leading-relaxed">
          Ein unerwarteter Fehler ist aufgetreten. Wir haben den Vorfall geloggt — Sie können den Vorgang einfach
          erneut versuchen.
        </p>
        {error.digest && (
          <p className="text-[11px] text-text-muted font-mono mb-6">
            Vorgangs-ID: <span className="bg-bg-secondary px-1.5 py-0.5 rounded border border-border">{error.digest}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <button onClick={reset} className="btn-primary">
            <RefreshCw className="w-4 h-4" /> Erneut versuchen
          </button>
          <Link href="/" className="btn-secondary">
            <Home className="w-4 h-4" /> Startseite
          </Link>
        </div>

        <div className="text-[11px] text-text-muted flex items-center justify-center gap-1.5">
          <Mail className="w-3 h-3" />
          Anhaltende Probleme?{' '}
          <a
            href={`mailto:support@candiq.de${error.digest ? `?subject=Fehler%20${error.digest}` : ''}`}
            className="underline hover:text-text-secondary"
          >
            support@candiq.de
          </a>
        </div>
      </div>
    </div>
  )
}
