'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, CheckCircle2, Loader2 } from 'lucide-react'

type CheckData = {
  id: string
  status: string
  employerName: string
  employerContact: string | null
  employerPhone: string | null
  position: string | null
  startDate: string | null
  endDate: string | null
  callNotes: string | null
  discrepancies: string | null
  rating: number | null
  result: string | null
}

const RESULTS = [
  { value: '', label: '— kein Ergebnis —' },
  { value: 'VERIFIED', label: 'Verifiziert' },
  { value: 'DISCREPANCY_FOUND', label: 'Unstimmigkeit gefunden' },
  { value: 'UNREACHABLE', label: 'Nicht erreichbar' },
  { value: 'DECLINED', label: 'Auskunft verweigert' },
]

export function ReviewerCheckClient({ check }: { check: CheckData }) {
  const router = useRouter()
  const [callNotes, setCallNotes] = useState(check.callNotes ?? '')
  const [discrepancies, setDiscrepancies] = useState(check.discrepancies ?? '')
  const [rating, setRating] = useState<number | ''>(check.rating ?? '')
  const [result, setResult] = useState(check.result ?? '')
  const [saving, setSaving] = useState(false)
  const [releasing, setReleasing] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/reviewer/checks/${check.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callNotes: callNotes || null,
          discrepancies: discrepancies || null,
          rating: rating === '' ? null : Number(rating),
          result: result || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Speichern fehlgeschlagen.')
      setMsg({ type: 'ok', text: 'Gespeichert.' })
      router.refresh()
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  async function release() {
    if (!confirm('Prüfung freigeben? Status wird auf „Abgeschlossen" gesetzt und der HR-Auftraggeber benachrichtigt.')) return
    setReleasing(true)
    setMsg(null)
    try {
      // Erst speichern, dann freigeben — damit die Notizen im Report landen.
      const saveRes = await fetch(`/api/reviewer/checks/${check.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callNotes: callNotes || null,
          discrepancies: discrepancies || null,
          rating: rating === '' ? null : Number(rating),
          result: result || null,
        }),
      })
      if (!saveRes.ok) throw new Error((await saveRes.json()).error ?? 'Speichern fehlgeschlagen.')

      const res = await fetch(`/api/reviewer/checks/${check.id}/release`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Freigabe fehlgeschlagen.')
      setMsg({ type: 'ok', text: 'Freigegeben. HR-Auftraggeber wurde benachrichtigt.' })
      router.push('/reviewer/queue')
      router.refresh()
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message })
      setReleasing(false)
    }
  }

  const released = check.status === 'COMPLETED'

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Kontext (read-only) */}
      <div className="card-md p-4 grid sm:grid-cols-2 gap-3 text-sm">
        <div><span className="text-text-muted">Arbeitgeber:</span> {check.employerName}</div>
        <div><span className="text-text-muted">Kontakt:</span> {check.employerContact ?? '—'}</div>
        <div><span className="text-text-muted">Telefon:</span> {check.employerPhone ?? '—'}</div>
        <div><span className="text-text-muted">Position:</span> {check.position ?? '—'}</div>
        <div><span className="text-text-muted">Zeitraum:</span> {check.startDate ?? '?'} – {check.endDate ?? '?'}</div>
      </div>

      {/* Reviewer-Eingaben */}
      <div className="card-md p-4 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-1">Gesprächsnotizen</label>
          <textarea
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            rows={6}
            maxLength={5000}
            disabled={released}
            className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2 text-sm"
            placeholder="Notizen aus dem Referenzgespräch…"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-primary mb-1">Diskrepanzen / Auffälligkeiten</label>
          <textarea
            value={discrepancies}
            onChange={(e) => setDiscrepancies(e.target.value)}
            rows={3}
            maxLength={5000}
            disabled={released}
            className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2 text-sm"
            placeholder="Markierte Unstimmigkeiten zwischen CV-Angaben und Referenzauskunft…"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1">Bewertung (1–5)</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={released}
              className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2 text-sm"
            >
              <option value="">— keine —</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1">Ergebnis</label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value)}
              disabled={released}
              className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2 text-sm"
            >
              {RESULTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`text-sm rounded-xl px-3 py-2 ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      {released ? (
        <div className="card-md p-4 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Diese Prüfung ist bereits freigegeben (abgeschlossen).
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button onClick={save} disabled={saving || releasing} className="btn-secondary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Speichern
          </button>
          <button onClick={release} disabled={saving || releasing} className="btn-primary">
            {releasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Freigeben
          </button>
        </div>
      )}
    </div>
  )
}

