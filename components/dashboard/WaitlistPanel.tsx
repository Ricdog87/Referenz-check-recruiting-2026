'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Search, Download } from 'lucide-react'

type WaitlistItem = {
  id: string
  createdAt: string
  company?: string
  name?: string
  email?: string
  website?: string
  placementsPerYear?: string
}

export function WaitlistPanel() {
  const [items, setItems] = useState<WaitlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [minPlacements, setMinPlacements] = useState('')

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

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const text = `${i.company || ''} ${i.name || ''} ${i.email || ''} ${i.website || ''}`.toLowerCase()
      const qOk = query.trim() === '' || text.includes(query.trim().toLowerCase())
      const placements = Number(i.placementsPerYear || 0)
      const min = Number(minPlacements || 0)
      const pOk = !minPlacements || placements >= min
      return qOk && pOk
    })
  }, [items, query, minPlacements])

  function exportCsv() {
    window.open('/api/waitlist-agency?format=csv', '_blank')
  }

  return (
    <div className="space-y-5">
      <div className="card-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="text-sm font-semibold text-text-primary">
          Anfragen gesamt: {items.length} · Gefiltert: {filtered.length}
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="input-field !pl-9"
              placeholder="Suche Firma, Name, E-Mail…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <input
            className="input-field w-36"
            placeholder="Min. Placements"
            value={minPlacements}
            onChange={(e) => setMinPlacements(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <button onClick={exportCsv} className="btn-secondary text-xs whitespace-nowrap">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card-md flex items-center justify-center py-12 text-text-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Warteliste wird geladen…
        </div>
      ) : error ? (
        <div className="card-md text-sm text-rose-700 bg-rose-50 border-rose-200">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="card-md text-sm text-text-secondary">Keine Treffer für den aktuellen Filter.</div>
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
              {filtered.map((i) => (
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
  )
}
