'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'

export default function NewCandidatePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    notes: '',
  })
  // gdprConsent wird durch Bewerber im Self-Service-Portal erteilt — siehe ConsentToken-Flow
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [fileError, setFileError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Muss zu /api/upload (MAX_SIZE) passen — sonst akzeptiert die UI Dateien,
  // die der Server stumm ablehnt.
  const MAX_FILE_SIZE = 4 * 1024 * 1024
  const ALLOWED_MIME = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ]

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return
    setFileError('')
    const accepted: File[] = []
    const rejected: string[] = []
    for (const f of Array.from(newFiles)) {
      if (!ALLOWED_MIME.includes(f.type)) {
        rejected.push(`${f.name} (Dateityp nicht erlaubt)`)
        continue
      }
      if (f.size > MAX_FILE_SIZE) {
        rejected.push(`${f.name} (zu groß, max. 4 MB)`)
        continue
      }
      accepted.push(f)
    }
    if (rejected.length > 0) {
      setFileError(`Nicht hinzugefügt: ${rejected.join(', ')}`)
    }
    setFiles((prev) => [...prev, ...accepted])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error || 'Fehler beim Anlegen des Kandidaten.')
      setLoading(false)
      return
    }

    const candidateId = data.id

    // Uploads: Fehler sammeln & zeigen, statt sie zu verschlucken.
    const failed: string[] = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('candidateId', candidateId)
      fd.append('type', 'CV')
      try {
        const up = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!up.ok) {
          const errData = await up.json().catch(() => ({}))
          failed.push(`${file.name}: ${errData?.error ?? `HTTP ${up.status}`}`)
        }
      } catch (err: any) {
        failed.push(`${file.name}: ${err?.message ?? 'Netzwerkfehler'}`)
      }
    }

    setLoading(false)

    if (failed.length > 0) {
      // Kandidat ist trotzdem angelegt — auf Detail-Seite weiterleiten,
      // aber mit Hinweis-Flag, damit die Seite einen Upload-Fehler zeigen kann.
      router.push(`/candidates/${candidateId}?uploadFailed=${encodeURIComponent(failed.join('|'))}`)
      return
    }

    router.push(`/candidates/${candidateId}`)
  }

  return (
    <>
      <Header
        title="Kandidat anlegen"
        subtitle="Neuen Kandidaten für Referenzprüfung erfassen"
        action={
          <Link href="/candidates" className="btn-secondary">
            Abbrechen
          </Link>
        }
      />

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Personal data */}
          <div className="card-md space-y-4">
            <h2 className="section-title">Persönliche Daten</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Vorname *</label>
                <input className="input-field" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
              </div>
              <div>
                <label className="label">Nachname *</label>
                <input className="input-field" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">E-Mail</label>
                <input type="email" className="input-field" value={form.email} onChange={(e) => update('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Telefon</label>
                <input type="tel" className="input-field" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Position */}
          <div className="card-md space-y-4">
            <h2 className="section-title">Bewerbung</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Stelle / Position *</label>
                <input className="input-field" value={form.position} onChange={(e) => update('position', e.target.value)} required placeholder="z.B. Senior Developer" />
              </div>
              <div>
                <label className="label">Abteilung</label>
                <input className="input-field" value={form.department} onChange={(e) => update('department', e.target.value)} placeholder="z.B. Engineering" />
              </div>
            </div>
            <div>
              <label className="label">Interne Notizen</label>
              <textarea
                className="input-field resize-none"
                rows={3}
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Interne Anmerkungen zur Bewerbung…"
              />
            </div>
          </div>

          {/* File upload (optional, intern) */}
          <div className="card-md space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="section-title">Optionale interne Dokumente</h2>
                <p className="text-xs text-text-secondary mt-1">
                  Z.B. ATS-Export, Bewerbungsanschreiben, interne Notizen. Den <strong>Lebenslauf lädt der Bewerber selbst</strong> über das DSGVO-konforme Einwilligungs-Portal hoch.
                </p>
              </div>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragOver ? 'border-brand-500 bg-brand-50/50' : 'border-border hover:border-brand-300 bg-bg-secondary/30'
              }`}
            >
              <p className="text-xs text-text-muted mb-2">
                Drag & Drop ODER
              </p>
              <label className="btn-secondary cursor-pointer text-xs py-1.5">
                Dateien auswählen
                <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              </label>
              <p className="text-[10px] text-text-muted mt-2">PDF, DOC, DOCX, JPG, PNG · Max. 4 MB</p>
            </div>

            {fileError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800">
                {fileError}
              </div>
            )}

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-bg-secondary rounded-lg px-3 py-2">
                    <span className="text-sm text-text-primary truncate">{f.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-text-muted">{(f.size / 1024).toFixed(0)} KB</span>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-text-secondary hover:text-rose-600 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DSGVO-Info: Bewerber willigt selbst ein via Self-Service-Portal */}
          <div className="card-md bg-emerald-50/40 border-emerald-200 space-y-2">
            <h2 className="section-title flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              DSGVO — Bewerber willigt selbst ein
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Sie sind <strong>automatisch DSGVO-konform</strong>: Nach dem Anlegen senden Sie dem Bewerber per Klick eine sichere Einwilligungs-Anfrage. Der Bewerber gibt die Einwilligung selbst, nennt seine Referenzgeber und behält jederzeit das Widerrufsrecht (Art. 7 Abs. 3 DSGVO). Audit-Trail inklusive.
            </p>
            <p className="text-xs text-emerald-700 font-medium">
              ✓ Keine schriftliche Einwilligung außerhalb des Tools nötig.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Wird angelegt…
                </span>
              ) : (
                'Kandidat anlegen'
              )}
            </button>
            <Link href="/candidates" className="btn-secondary">
              Abbrechen
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}
