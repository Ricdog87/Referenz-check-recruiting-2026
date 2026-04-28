'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Check {
  id: string
  status: string
  result: string | null
  callNotes: string | null
  discrepancies: string | null
  rating: number | null
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Offen' },
  { value: 'IN_PROGRESS', label: 'In Bearbeitung' },
  { value: 'COMPLETED', label: 'Abgeschlossen' },
  { value: 'FAILED', label: 'Fehlgeschlagen' },
]

const RESULT_OPTIONS = [
  { value: '', label: '— kein Ergebnis —' },
  { value: 'VERIFIED', label: 'Verifiziert ✓' },
  { value: 'DISCREPANCY_FOUND', label: 'Unstimmigkeit gefunden ✕' },
  { value: 'UNREACHABLE', label: 'Nicht erreichbar' },
  { value: 'DECLINED', label: 'Auskunft verweigert' },
]

export function CheckEditor({ check }: { check: Check }) {
  const router = useRouter()
  const [status, setStatus] = useState(check.status)
  const [result, setResult] = useState(check.result || '')
  const [callNotes, setCallNotes] = useState(check.callNotes || '')
  const [discrepancies, setDiscrepancies] = useState(check.discrepancies || '')
  const [rating, setRating] = useState(check.rating || 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    setSaved(false)
    await fetch(`/api/checks/${check.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        result: result || null,
        callNotes: callNotes || null,
        discrepancies: discrepancies || null,
        rating: rating || null,
        calledAt: status !== 'OPEN' ? new Date().toISOString() : null,
      }),
    })
    setSaving(false)
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="card-md space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Prüfungsprotokoll</h2>
        <button onClick={save} disabled={saving} className="btn-primary text-sm py-2">
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Speichern…
            </span>
          ) : saved ? (
            '✓ Gespeichert'
          ) : (
            'Speichern'
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Status</label>
          <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Ergebnis</label>
          <select className="input-field" value={result} onChange={(e) => setResult(e.target.value)}>
            {RESULT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="label">Bewertung (1–5 Sterne)</label>
        <div className="flex gap-2 mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(rating === star ? 0 : star)}
              className={`text-2xl transition-transform hover:scale-110 ${
                star <= rating ? 'text-amber-500' : 'text-text-disabled'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Gesprächsnotizen</label>
        <textarea
          className="input-field resize-none"
          rows={5}
          value={callNotes}
          onChange={(e) => setCallNotes(e.target.value)}
          placeholder="Zusammenfassung des Gesprächs mit dem früheren Arbeitgeber…"
        />
      </div>

      <div>
        <label className="label">Festgestellte Unstimmigkeiten</label>
        <textarea
          className="input-field resize-none !border-amber-200 focus:!border-amber-400"
          rows={3}
          value={discrepancies}
          onChange={(e) => setDiscrepancies(e.target.value)}
          placeholder="Abweichungen zwischen Angaben im Lebenslauf und Auskunft des Arbeitgebers…"
        />
        <p className="text-xs text-text-muted mt-1">
          Nur ausfüllen wenn Unstimmigkeiten festgestellt wurden.
        </p>
      </div>
    </div>
  )
}
