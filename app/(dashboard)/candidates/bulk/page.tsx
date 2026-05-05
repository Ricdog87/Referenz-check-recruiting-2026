'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import {
  Upload, FileText, AlertCircle, CheckCircle2, Loader2, ArrowRight,
  ShieldAlert, Wand2, Download,
} from 'lucide-react'

type DryRunResult = {
  ok: boolean
  dryRun: true
  totalRows: number
  valid: number
  errors: Array<{ row: number; message: string; data: any }>
  duplicates: Array<{ row: number; email: string }>
  preview: Array<{ firstName: string; lastName: string; email: string; position: string; department: string }>
}

type ImportResult = {
  ok: boolean
  dryRun: false
  totalRows: number
  created: number
  errors: Array<{ row: number; message: string }>
  duplicates: Array<{ row: number; email: string }>
}

const SAMPLE_CSV = `firstName,lastName,email,phone,position,department,notes
Lukas,Berger,lukas.berger@example.com,+49 30 1234567,Senior Backend Engineer,Engineering,Bewerbung über LinkedIn
Sarah,Hoffmann,sarah.hoffmann@example.com,+49 89 998877,Senior Product Manager,Product,Empfehlung über Netzwerk
Jonas,Vogel,jonas.vogel@example.com,,Data Scientist,Analytics,
`

export default function BulkUploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmGdpr, setConfirmGdpr] = useState(false)

  async function preview(f: File) {
    setError('')
    setDryRun(null)
    setResult(null)
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      fd.append('dryRun', 'true')
      const res = await fetch('/api/candidates/bulk', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'Vorschau fehlgeschlagen.')
      } else {
        setDryRun(data)
      }
    } catch {
      setError('Verbindung fehlgeschlagen.')
    } finally {
      setLoading(false)
    }
  }

  async function importNow() {
    if (!file || !confirmGdpr) return
    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/candidates/bulk', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'Import fehlgeschlagen.')
      } else {
        setResult(data)
        router.refresh()
      }
    } catch {
      setError('Verbindung fehlgeschlagen.')
    } finally {
      setLoading(false)
    }
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'candiq-bulk-vorlage.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Header
        title="Bulk-Import"
        subtitle="Mehrere Kandidaten gleichzeitig per CSV anlegen"
        action={<Link href="/candidates" className="btn-secondary">Zurück</Link>}
      />

      <div className="max-w-3xl space-y-5">
        {/* Schritt 1: Datei wählen */}
        {!result && (
          <div className="card-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="section-title">1. CSV hochladen</h2>
              <button
                type="button"
                onClick={downloadSample}
                className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Vorlage herunterladen
              </button>
            </div>

            <div
              className="rounded-2xl border-2 border-dashed border-border bg-bg-secondary/40 p-8 text-center hover:border-brand-300 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files?.[0]
                if (f) { setFile(f); preview(f) }
              }}
            >
              {loading && !dryRun ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                  <div className="text-xs text-text-secondary">CSV wird ausgelesen…</div>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-brand-600" />
                  <div className="text-sm font-semibold text-text-primary">{file.name}</div>
                  <div className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB</div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                    className="text-xs text-brand-700 hover:text-brand-800 underline"
                  >
                    Andere Datei wählen
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center text-white">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-semibold text-text-primary">CSV-Datei hierher ziehen oder klicken</div>
                  <div className="text-xs text-text-secondary">Max. 500 Zeilen, 2 MB · Komma- oder Semikolon-getrennt</div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) { setFile(f); preview(f) }
                  e.target.value = ''
                }}
              />
            </div>

            <div className="text-[11px] text-text-muted leading-relaxed">
              <strong>Erwartete Spalten:</strong> firstName, lastName, position (Pflicht) · email, phone, department, notes (optional).
              Header-Schreibweisen wie „Vorname", „Nachname", „Stelle" werden automatisch erkannt.
            </div>
          </div>
        )}

        {/* Schritt 2: Vorschau / Validierung */}
        {dryRun && !result && (
          <>
            <div className="card-md space-y-4">
              <h2 className="section-title">2. Vorschau &amp; Bestätigung</h2>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Insgesamt" value={dryRun.totalRows} tone="brand" />
                <Stat label="Importierbar" value={dryRun.valid} tone="emerald" />
                <Stat label="Fehler" value={dryRun.errors.length} tone={dryRun.errors.length > 0 ? 'rose' : 'emerald'} />
              </div>

              {dryRun.errors.length > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <div className="text-xs font-bold text-rose-900 mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {dryRun.errors.length} Zeilen werden übersprungen
                  </div>
                  <ul className="space-y-1 text-[11px] text-rose-800 max-h-32 overflow-y-auto">
                    {dryRun.errors.slice(0, 10).map((e, i) => (
                      <li key={i}><strong>Zeile {e.row}:</strong> {e.message}</li>
                    ))}
                    {dryRun.errors.length > 10 && (
                      <li className="text-rose-600 italic">…und {dryRun.errors.length - 10} weitere</li>
                    )}
                  </ul>
                </div>
              )}

              {dryRun.duplicates.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="text-xs font-bold text-amber-900 mb-1.5">
                    {dryRun.duplicates.length} doppelte E-Mail-Adressen in der CSV
                  </div>
                  <ul className="space-y-0.5 text-[11px] text-amber-800 max-h-24 overflow-y-auto">
                    {dryRun.duplicates.slice(0, 10).map((d, i) => (
                      <li key={i}>Zeile {d.row}: {d.email}</li>
                    ))}
                  </ul>
                </div>
              )}

              {dryRun.preview.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2">
                    Vorschau (erste {dryRun.preview.length} Kandidaten)
                  </div>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-bg-secondary border-b border-border">
                        <tr>
                          <th className="text-left px-3 py-2 font-bold text-text-muted">Name</th>
                          <th className="text-left px-3 py-2 font-bold text-text-muted">Position</th>
                          <th className="text-left px-3 py-2 font-bold text-text-muted hidden sm:table-cell">E-Mail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {dryRun.preview.map((p, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5 font-semibold">{p.firstName} {p.lastName}</td>
                            <td className="px-3 py-1.5">{p.position}{p.department && <span className="text-text-muted"> · {p.department}</span>}</td>
                            <td className="px-3 py-1.5 text-text-muted hidden sm:table-cell">{p.email || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* DSGVO-Hinweis vor Import */}
            <div className="card-md bg-amber-50/40 border-amber-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input type="checkbox" checked={confirmGdpr} onChange={(e) => setConfirmGdpr(e.target.checked)} className="sr-only" />
                  <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${
                    confirmGdpr ? 'bg-brand-500 border-brand-500' : 'border-border bg-white'
                  }`}>
                    {confirmGdpr && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Wichtig — DSGVO-Status der Bulk-Importe
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Beim Bulk-Import werden alle Kandidaten mit Status <strong>„Ausstehend"</strong> und
                    <strong> ohne DSGVO-Einwilligung</strong> angelegt. Bevor eine Referenzprüfung gestartet
                    werden kann, muss die Einwilligung pro Kandidat manuell gesetzt werden. Ich bestätige,
                    dass ich für die Erfassung dieser Daten die Rechtsgrundlage (Art. 6 DSGVO) habe.
                  </p>
                </div>
              </label>
            </div>

            {error && (
              <div role="alert" className="px-4 py-3 rounded-xl text-sm text-rose-700 bg-rose-50 border border-rose-200">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={importNow}
                disabled={loading || !confirmGdpr || dryRun.valid === 0}
                className="btn-primary flex-[2]"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Wird importiert…</>
                  : <>{dryRun.valid} Kandidaten anlegen <ArrowRight className="w-4 h-4" /></>
                }
              </button>
              <button
                type="button"
                onClick={() => { setDryRun(null); setFile(null); setConfirmGdpr(false) }}
                className="btn-secondary"
              >
                Abbrechen
              </button>
            </div>
          </>
        )}

        {/* Schritt 3: Ergebnis */}
        {result && (
          <div className="card-md text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-1">Import abgeschlossen</h2>
              <p className="text-sm text-text-secondary">
                <strong>{result.created}</strong> Kandidaten wurden angelegt
                {result.errors.length > 0 && <> · {result.errors.length} Zeilen übersprungen</>}.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Link href="/candidates" className="btn-primary">
                Zur Kandidaten-Liste <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => { setResult(null); setDryRun(null); setFile(null); setConfirmGdpr(false) }}
                className="btn-secondary"
              >
                Weiteren Import starten
              </button>
            </div>
          </div>
        )}

        {/* Help-Card */}
        {!file && !result && (
          <div className="card-md bg-gradient-to-br from-brand-50/40 to-violet/5 border-brand-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center text-white flex-shrink-0">
                <Wand2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary mb-1">Tipp für PDL und Volume-Recruiting</div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Sie können bis zu 500 Kandidaten pro Import anlegen. Nach dem Bulk-Import legen Sie pro
                  Kandidat individuell den CV nach (auch Bulk-Upload möglich) — die DSGVO-Einwilligung
                  setzen Sie spätestens beim Start der ersten Referenzprüfung pro Kandidat.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'brand' | 'emerald' | 'rose' }) {
  const toneCls = {
    brand: 'text-brand-700 bg-brand-50 border-brand-200',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    rose: 'text-rose-700 bg-rose-50 border-rose-200',
  }[tone]
  return (
    <div className={`rounded-xl border p-3 text-center ${toneCls}`}>
      <div className="text-2xl font-black tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-widest font-bold opacity-80">{label}</div>
    </div>
  )
}
