'use client'

import { useEffect } from 'react'

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
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-text-primary mb-3">Etwas ist schiefgelaufen</h1>
        <p className="text-text-secondary mb-8">
          Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
        </p>
        <button onClick={reset} className="btn-primary">
          Erneut versuchen
        </button>
      </div>
    </div>
  )
}
