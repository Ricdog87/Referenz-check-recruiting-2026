'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCircle2, Loader2 } from 'lucide-react'

type Reviewer = {
  id: string
  name: string
  email: string
}

type Props = {
  checkId: string
  currentReviewerId: string | null
  reviewers: Reviewer[]
  currentUserId: string
}

export function AssignmentDropdown({
  checkId,
  currentReviewerId,
  reviewers,
  currentUserId,
}: Props) {
  const router = useRouter()
  const [value, setValue] = useState(currentReviewerId ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function update(nextValue: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reviewer/checks/${checkId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId: nextValue === '' ? null : nextValue }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? 'Zuweisung fehlgeschlagen.')
        setValue(currentReviewerId ?? '')
        setLoading(false)
        return
      }
      setValue(nextValue)
      router.refresh()
    } catch {
      setError('Verbindungsfehler.')
      setValue(currentReviewerId ?? '')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <UserCircle2 className="w-4 h-4 text-text-muted" />
      <label className="text-xs text-text-muted whitespace-nowrap">
        Reviewer:
      </label>
      <select
        value={value}
        onChange={(e) => update(e.target.value)}
        disabled={loading}
        className="text-sm bg-bg-secondary border border-border rounded-lg px-2 py-1 disabled:opacity-60"
      >
        <option value="">— nicht zugewiesen —</option>
        {reviewers.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name ?? r.email}
            {r.id === currentUserId ? ' (ich)' : ''}
          </option>
        ))}
      </select>
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-text-muted" />}
      {error && <span className="text-[11px] text-rose-700">{error}</span>}
      {value !== currentReviewerId && !loading && !error ? null : null}
      {value === '' && currentUserId && !loading && (
        <button
          type="button"
          onClick={() => update(currentUserId)}
          className="text-[11px] font-semibold text-brand-700 hover:text-brand-800 whitespace-nowrap"
        >
          → mir zuweisen
        </button>
      )}
    </div>
  )
}
