'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main id="main" className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-5 text-rose-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-3">Etwas ist schiefgelaufen</h1>
        <p className="text-text-secondary mb-8">
          Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.
        </p>
        <div className="flex gap-2 justify-center">
          <button onClick={reset} className="btn-primary">Erneut versuchen</button>
          <Link href="/" className="btn-secondary">Zur Startseite</Link>
        </div>
      </div>
    </main>
  )
}
