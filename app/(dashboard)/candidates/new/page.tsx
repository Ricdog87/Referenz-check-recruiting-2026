'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import {
  Upload, Loader2, Sparkles, ShieldCheck, FileText, X, CheckCircle2,
  AlertCircle, Wand2, Phone, ArrowRight,
} from 'lucide-react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 4 * 1024 * 1024

type Employer = {
  employerName: string
  position: string
  startDate: string
  endDate: string
  location: string
  current: boolean
}

type ParseResult = {
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  summary: string
  skills: string[]
  previousEmployers: Employer[]
}

export default function NewCandidatePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    position: '', department: '', notes: '',
  })
  const [gdprConsent, setGdprConsent] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)

  // Parse state
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parseHint, setParseHint] = useState<string | null>(null)
  const [employersToCheck, setEmployersToCheck] = useState<Set<number>>(new Set())

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function update<K extends keyof typeof form>(field: K, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Format nicht unterstützt. Bitte PDF, JPG oder PNG.'
    }
    if (file.size > MAX_BYTES) {
      return `Datei zu groß (max. ${Math.round(MAX_BYTES / 1024 / 1024)} MB).`
    }
    return null
  }

  async function handleCvUpload(file: File) {
    const validationErr = validateFile(file)
    if (validationErr) {
      setParseError(validationErr)
      return
    }

    setParseError(null)
    setParseHint(null)
    setParsing(true)
    setFiles((prev) => (prev.find((f) => f.name === file.name) ? prev : [...prev, file]))

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/candidates/parse', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setParseError(data?.error || 'CV konnte nicht ausgelesen werden.')
        if (data?.operatorHint) setParseHint(data.operatorHint)
        setParsing(false)
        return
      }

      const d: ParseResult = data.data
      setParsed(d)
      setForm({
        firstName: d.firstName || '',
        lastName: d.lastName || '',
        email: d.email || '',
        phone: d.phone || '',
        position: d.position || '',
        department: d.department || '',
        notes: [d.summary, d.skills?.length ? `Skills: ${d.skills.join(', ')}` : ''].filter(Boolean).join('\n\n'),
      })
      // Standardmäßig die ersten 3 Arbeitgeber als Check-Vorschläge markieren
      setEmployersToCheck(new Set(d.previousEmployers.slice(0, 3).map((_, i) => i)))
    } catch {
      setParseError('Verbindung fehlgeschlagen. Bitte erneut versuchen oder Felder manuell ausfüllen.')
    } finally {
      setParsing(false)
    }
  }

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles || newFiles.length === 0) return
    const file = newFiles[0]
    if (!file) return
    handleCvUpload(file)
  }

  function toggleEmployer(idx: number) {
    setEmployersToCheck((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    if (!form.firstName.trim() || !form.lastName.trim() || !form.position.trim()) {
      setError('Vorname, Nachname und Position sind erforderlich.')
      return
    }
    if (form.email && !EMAIL_REGEX.test(form.email.trim())) {
      setError('Bitte gültige E-Mail-Adresse eingeben.')
      return
    }
    if (!gdprConsent) {
      setError('Bitte DSGVO-Einwilligung des Kandidaten bestätigen.')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      // 1) Kandidat anlegen
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, gdprConsent }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Kandidat konnte nicht angelegt werden.')
        setSubmitting(false)
        return
      }
      const candidateId = data.id

      // 2) Datei-Uploads
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('candidateId', candidateId)
        fd.append('type', 'CV')
        await fetch('/api/upload', { method: 'POST', body: fd }).catch(() => {})
      }

      // 3) Referenz-Checks aus den vorgeschlagenen Arbeitgebern anlegen
      if (parsed && employersToCheck.size > 0) {
        const employers = Array.from(employersToCheck)
          .map((i) => parsed.previousEmployers[i])
          .filter(Boolean) as Employer[]
        await Promise.all(
          employers.map((e) =>
            fetch('/api/checks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                candidateId,
                employerName: e.employerName,
                position: e.position,
                startDate: e.startDate,
                endDate: e.current ? '' : e.endDate,
              }),
            }).catch(() => null),
          ),
        )
      }

      router.push(`/candidates/${candidateId}`)
    } catch {
      setError('Verbindung fehlgeschlagen. Bitte erneut versuchen.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header
        title="Kandidat anlegen"
        subtitle="CV hochladen — wir füllen den Rest aus"
        action={<Link href="/candidates" className="btn-secondary">Abbrechen</Link>}
      />

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── 1. CV-Upload-Zone (das Hero-Element) ── */}
          <div className={`relative rounded-2xl overflow-hidden border-2 border-dashed transition-all ${
            dragOver ? 'border-brand-500 bg-brand-50/50 scale-[1.01]' : parsed
              ? 'border-emerald-400 bg-emerald-50/30'
              : 'border-brand-200 bg-gradient-to-br from-brand-50/40 to-violet/5 hover:border-brand-300'
          }`}>
            {/* Decorative blob */}
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-40 blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.4), transparent 60%)' }} />

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
              className="relative p-8 text-center"
            >
              {parsing ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center text-white shadow-glow">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-amber-900" />
                    </div>
                  </div>
                  <div className="text-sm font-bold text-text-primary">CV wird ausgewertet…</div>
                  <div className="text-xs text-text-secondary max-w-md">
                    Claude liest Name, Position, Kontaktdaten und Berufsstationen aus.
                    <br />Dauert in der Regel 5-10 Sekunden.
                  </div>
                </div>
              ) : parsed ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div className="text-sm font-bold text-text-primary">CV erfolgreich ausgewertet</div>
                  <div className="text-xs text-text-secondary max-w-md">
                    Bitte prüfen Sie die unten ausgefüllten Felder. Sie können alles bearbeiten.
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-semibold text-brand-700 hover:text-brand-800 underline mt-1"
                  >
                    Anderen CV hochladen
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center text-white shadow-glow">
                    <Wand2 className="w-7 h-7" />
                  </div>
                  <div className="text-base font-bold text-text-primary flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    CV hochladen — Felder werden automatisch ausgefüllt
                  </div>
                  <div className="text-xs text-text-secondary max-w-md leading-relaxed">
                    PDF, JPG oder PNG (max. 4 MB). Wir extrahieren Name, Position, Kontaktdaten und Berufsstationen — und schlagen Referenzprüfungen vor.
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary mt-2 text-sm"
                  >
                    <Upload className="w-4 h-4" /> CV auswählen oder hierher ziehen
                  </button>
                  <button
                    type="button"
                    onClick={() => { setParsed({ firstName: '', lastName: '', email: '', phone: '', position: '', department: '', summary: '', skills: [], previousEmployers: [] }) }}
                    className="text-[11px] text-text-muted hover:text-text-primary underline mt-1"
                  >
                    Lieber manuell ausfüllen →
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </div>

          {parseError && (
            <div role="alert" className="px-4 py-3 rounded-xl text-sm text-amber-800 bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold mb-0.5">CV-Auto-Parsing nicht möglich</div>
                  <div className="text-xs">{parseError}</div>
                  {parseHint && (
                    <div className="text-[10px] font-mono mt-2 px-2 py-1 bg-white/60 border border-amber-200 rounded">
                      Setup: {parseHint}
                    </div>
                  )}
                  <div className="text-xs mt-2">Sie können die Felder unten trotzdem manuell ausfüllen.</div>
                </div>
              </div>
            </div>
          )}

          {parsed && (
            <div className="px-4 py-3 rounded-xl text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Daten aus CV übernommen. Bitte prüfen — alle Felder sind editierbar.
              </span>
            </div>
          )}

          {/* ── 2. Persönliche Daten ── */}
          {(parsed !== null || parseError) && (
            <>
              <div className="card-md space-y-4">
                <h2 className="section-title">Persönliche Daten</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Vorname *</label>
                    <input className="input-field" value={form.firstName}
                      onChange={(e) => update('firstName', e.target.value)} required maxLength={120} />
                  </div>
                  <div>
                    <label className="label">Nachname *</label>
                    <input className="input-field" value={form.lastName}
                      onChange={(e) => update('lastName', e.target.value)} required maxLength={120} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">E-Mail</label>
                    <input type="email" className="input-field" value={form.email}
                      onChange={(e) => update('email', e.target.value)} maxLength={254} />
                  </div>
                  <div>
                    <label className="label">Telefon</label>
                    <input type="tel" className="input-field" value={form.phone}
                      onChange={(e) => update('phone', e.target.value)} maxLength={40} />
                  </div>
                </div>
              </div>

              <div className="card-md space-y-4">
                <h2 className="section-title">Bewerbung</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Position *</label>
                    <input className="input-field" value={form.position}
                      onChange={(e) => update('position', e.target.value)} required maxLength={200} />
                  </div>
                  <div>
                    <label className="label">Abteilung</label>
                    <input className="input-field" value={form.department}
                      onChange={(e) => update('department', e.target.value)} maxLength={120} />
                  </div>
                </div>
                <div>
                  <label className="label">Notizen / Profil</label>
                  <textarea className="input-field resize-none" rows={4} value={form.notes}
                    onChange={(e) => update('notes', e.target.value)} placeholder="Wird bei CV-Parse automatisch mit Profil-Summary gefüllt." />
                </div>
              </div>

              {/* ── 3. Referenz-Check-Vorschläge ── */}
              {parsed && parsed.previousEmployers.length > 0 && (
                <div className="card-md bg-gradient-to-br from-brand-50/40 to-violet/5 border-brand-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className="section-title flex items-center gap-2">
                        <Phone className="w-4 h-4 text-brand-600" />
                        Referenz-Checks vorbereiten
                      </h2>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Wir haben {parsed.previousEmployers.length} Stationen aus dem CV extrahiert.
                        Markierte werden gleich als Prüfung angelegt.
                      </p>
                    </div>
                    <span className="badge-brand text-[10px]">
                      {employersToCheck.size}/{parsed.previousEmployers.length} ausgewählt
                    </span>
                  </div>
                  <div className="space-y-2">
                    {parsed.previousEmployers.map((emp, idx) => {
                      const active = employersToCheck.has(idx)
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleEmployer(idx)}
                          className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                            active
                              ? 'border-brand-500 bg-white shadow-card'
                              : 'border-border bg-white/60 hover:border-brand-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${
                            active ? 'bg-brand-500 border-brand-500' : 'border-border bg-white'
                          }`}>
                            {active && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-text-primary">{emp.employerName}</span>
                              {emp.current && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">
                                  aktuell
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-text-secondary">
                              {emp.position}
                              {(emp.startDate || emp.endDate) && (
                                <> · {emp.startDate || '?'} – {emp.current ? 'heute' : (emp.endDate || '?')}</>
                              )}
                              {emp.location && <> · {emp.location}</>}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── 4. Hochgeladene Dateien ── */}
              {files.length > 0 && (
                <div className="card-md space-y-3">
                  <h2 className="section-title">Dokumente ({files.length})</h2>
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-secondary border border-border">
                      <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-text-primary truncate">{f.name}</div>
                        <div className="text-[10px] text-text-muted">{(f.size / 1024).toFixed(0)} KB</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
                        className="text-text-muted hover:text-rose-600 p-1"
                        aria-label="Entfernen"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 5. DSGVO ── */}
              <div className="card-md bg-brand-50/30 border-brand-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input type="checkbox" checked={gdprConsent}
                      onChange={(e) => setGdprConsent(e.target.checked)} className="sr-only" />
                    <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${
                      gdprConsent ? 'bg-brand-500 border-brand-500' : 'border-border bg-white'
                    }`}>
                      {gdprConsent && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                      DSGVO-Einwilligung des Kandidaten
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Der Kandidat wurde gemäß Art. 6 DSGVO über die Verarbeitung seiner personenbezogenen Daten
                      sowie die geplante Referenzprüfung informiert und hat seine Einwilligung erteilt.
                    </p>
                  </div>
                </label>
              </div>

              {error && (
                <div role="alert" className="px-4 py-3 rounded-xl text-sm text-rose-700 bg-rose-50 border border-rose-200">
                  {error}
                </div>
              )}

              <div className="flex gap-3 sticky bottom-4">
                <button type="submit" disabled={submitting} className="btn-primary flex-[2]">
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wird angelegt…
                    </span>
                  ) : (
                    <>
                      Anlegen
                      {parsed && employersToCheck.size > 0 && (
                        <span className="text-xs opacity-90">
                          + {employersToCheck.size} Prüfung{employersToCheck.size !== 1 ? 'en' : ''}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <Link href="/candidates" className="btn-secondary">Abbrechen</Link>
              </div>
            </>
          )}
        </form>
      </div>
    </>
  )
}
