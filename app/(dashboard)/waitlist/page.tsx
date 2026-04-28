'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Users2, Loader2 } from 'lucide-react'

type WaitlistItem = {
  id: string
  createdAt: string
  company?: string
  name?: string
  email?: string
  website?: string
  placementsPerYear?: string
}

export default function WaitlistPage() {
  const [items, setItems] = useState<WaitlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/waitlist-agency')
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Laden fehlgeschlagen.')
        return data
      })
      .then((data) => setItems(data.items ?? []))
      .catch((e: any) => setError(e.message || 'Laden fehlgeschlagen.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Header title="PDL-Warteliste" subtitle="Übersicht aller Wartelisten-Anfragen" />

      <div className="space-y-5">
        <div className="card-md flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Users2 className="w-4 h-4 text-brand-600" /> Anfragen gesamt: {items.length}
          </div>
          <div className="text-xs text-text-muted">Neueste 100 Einträge</div>
        </div>

        {loading ? (
          <div className="card-md flex items-center justify-center py-12 text-text-muted text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Warteliste wird geladen…
          </div>
        ) : error ? (
          <div className="card-md text-sm text-rose-700 bg-rose-50 border-rose-200">{error}</div>
        ) : items.length === 0 ? (
          <div className="card-md text-sm text-text-secondary">Noch keine Wartelisten-Anfragen vorhanden.</div>
        ) : (
          <div className="card-md overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="text-left p-4">Zeitpunkt</th>
                  <th className="text-left p-4">Firma</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">E-Mail</th>
                  <th className="text-left p-4">Website / LinkedIn</th>
                  <th className="text-left p-4">Placements/Jahr</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0">
                    <td className="p-4 text-xs text-text-secondary">{new Date(i.createdAt).toLocaleString('de-DE')}</td>
                    <td className="p-4">{i.company || '—'}</td>
                    <td className="p-4">{i.name || '—'}</td>
                    <td className="p-4">{i.email || '—'}</td>
                    <td className="p-4">
                      {i.website ? <a href={i.website} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">{i.website}</a> : '—'}
                    </td>
                    <td className="p-4">{i.placementsPerYear || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
