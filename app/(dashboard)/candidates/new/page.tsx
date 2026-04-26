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
  const [gdprConsent, setGdprConsent] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return
    const valid = Array.from(newFiles).filter((f) => {
      const ok = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
      ].includes(f.type)
      return ok && f.size < 10 * 1024 * 1024
    })
    setFiles((prev) => [...prev, ...valid])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!gdprConsent) {
      setError('Bitte bestätigen Sie die DSGVO-Einwilligung des Kandidaten.')
      return
    }
    setError('')
    setLoading(true)

    const res = await fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, gdprConsent }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Fehler beim Anlegen des Kandidaten.')
      setLoading(false)
      return
    }

    const candidateId = data.id

    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('candidateId', candidateId)
      fd.append('type', 'CV')
      await fetch('/api/upload', { method: 'POST', body: fd })
    }

    setLoading(false)
    router.push(`/candidates/${candidateId}`)
  }

  return (
    <div className="animate-fade-in">
      <Header
        title="Neuen Kandidaten anlegen"
        subtitle="In 3 Schritten: Daten → CV Upload → DSGVO bestätigen"
        action={
          <Link href="/candidates" className="btn-secondary">
            Abbrechen
          </Link>
        }
      />

      <div className="p-6 grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card space-y-4">
              <h2 className="section-title">1) Persönliche Daten</h2>
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

            <div className="card space-y-4">
              <h2 className="section-title">2) Bewerbungskontext</h2>
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

            <div className="card space-y-4">
              <h2 className="section-title">3) CV & Unterlagen hochladen</h2>
              <p className="text-sm text-text-secondary">
                Laden Sie den CV direkt beim Anlegen hoch. So startet der Referenzprüfungsprozess ohne Medienbruch.
              </p>

              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  handleFiles(e.dataTransfer.files)
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragOver ? 'border-accent bg-accent-glow' : 'border-border hover:border-border-strong'
                }`}
              >
                <div className="text-3xl mb-3">📄</div>
                <p className="text-sm text-text-secondary mb-2">CV, Zeugnisse und Arbeitsnachweise hier ablegen</p>
                <p className="text-xs text-text-muted mb-4">PDF, DOC, DOCX, JPG, PNG · Max. 10 MB pro Datei</p>
                <label className="btn-secondary cursor-pointer text-xs py-2">
                  Dateien auswählen
                  <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                </label>
              </div>

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
                          className="text-text-secondary hover:text-status-error transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card border-accent/20 bg-accent-glow space-y-3">
              <h2 className="section-title">🛡 DSGVO-Einwilligung</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Gemäß Art. 6 DSGVO ist eine Rechtsgrundlage für die Verarbeitung personenbezogener Daten erforderlich.
                Bitte bestätigen Sie die dokumentierte Einwilligung des Kandidaten.
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={gdprConsent} onChange={(e) => setGdprConsent(e.target.checked)} className="mt-0.5 accent-accent" />
                <span className="text-sm text-text-primary">
                  Der Kandidat wurde informiert und hat der Referenzprüfung inkl. Datennutzung ausdrücklich zugestimmt.
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-status-errorBg border border-status-error/20 rounded-lg px-4 py-3 text-sm text-status-error">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Kandidat wird angelegt…
                  </span>
                ) : (
                  'Kandidat + CV anlegen'
                )}
              </button>
              <Link href="/candidates" className="btn-secondary">
                Zurück
              </Link>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="section-title mb-3">Warum dieser Ablauf?</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Durch das direkte Hochladen des CV beim Kandidaten-Setup startet Ihr Team ohne Wartezeit in die Referenzprüfung.
              Das reduziert Rückfragen und spart Zeit im Recruiting-Prozess.
            </p>
          </div>

          <div className="card border-status-success/20 bg-status-successBg">
            <h3 className="section-title mb-3">Best Practice für Kunden-Demo</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• Erst Kandidat + CV erfassen</li>
              <li>• Danach Referenzprüfung starten</li>
              <li>• Status live im Dashboard zeigen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
