'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function CandidateActions({ candidateId }: { candidateId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Kandidaten und alle zugehörigen Daten unwiderruflich löschen?')) return
    setDeleting(true)
    await fetch(`/api/candidates/${candidateId}`, { method: 'DELETE' })
    router.push('/candidates')
    router.refresh()
  }

  async function updateStatus(status: string) {
    await fetch(`/api/candidates/${candidateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
    setOpen(false)
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="btn-secondary text-sm py-2 px-3">
        ⋯
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 bg-bg-card border border-border rounded-xl shadow-card z-20 py-1 overflow-hidden">
            {[
              { label: 'Als "In Prüfung"', status: 'IN_REVIEW' },
              { label: 'Als "Abgeschlossen"', status: 'COMPLETED' },
              { label: 'Als "Ausstehend"', status: 'PENDING' },
              { label: 'Abgelehnt', status: 'REJECTED' },
            ].map((s) => (
              <button
                key={s.status}
                onClick={() => updateStatus(s.status)}
                className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
              >
                {s.label}
              </button>
            ))}
            <div className="border-t border-border my-1" />
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full text-left px-4 py-2 text-sm text-status-error hover:bg-status-errorBg transition-colors"
            >
              {deleting ? 'Wird gelöscht…' : 'Kandidat löschen'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
