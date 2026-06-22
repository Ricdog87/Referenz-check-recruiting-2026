'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, Loader2, CheckCircle2, AlertCircle, Trash2, ShieldCheck,
} from 'lucide-react'

export function PartnerCoBrandUploader({
  initialLogoUrl,
  companyName,
}: {
  initialLogoUrl: string | null
  companyName: string
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'deleting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('uploading')
    setMessage('')

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch('/api/partner/co-brand', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Upload fehlgeschlagen.')
        return
      }
      setLogoUrl(data.logoUrl)
      setStatus('success')
      setMessage('Logo gespeichert.')
      router.refresh()
      setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('error')
      setMessage('Netzwerk-Fehler.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete() {
    if (!confirm('Logo wirklich entfernen?')) return
    setStatus('deleting')
    setMessage('')

    try {
      const res = await fetch('/api/partner/co-brand', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setStatus('error')
        setMessage(data.error ?? 'Löschen fehlgeschlagen.')
        return
      }
      setLogoUrl(null)
      setStatus('success')
      setMessage('Logo entfernt.')
      router.refresh()
      setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('error')
      setMessage('Netzwerk-Fehler.')
    }
  }

  const busy = status === 'uploading' || status === 'deleting'

  return (
    <div className="space-y-4">
      {/* Aktuelles Logo ─────────────────────────────────────────────── */}
      {logoUrl ? (
        <div className="flex items-center gap-4 p-4 bg-white border border-border-default rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={`Logo ${companyName}`}
            className="h-16 w-auto max-w-[200px] object-contain"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-text-primary">Aktives Logo</div>
            <div className="text-[10px] text-text-muted truncate" title={logoUrl}>
              {logoUrl}
            </div>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {status === 'deleting' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Entfernen
          </button>
        </div>
      ) : (
        <div className="p-6 bg-surface-subtle border-2 border-dashed border-border-default rounded-lg text-center">
          <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <div className="text-sm font-semibold text-text-primary">Noch kein Logo</div>
          <div className="text-xs text-text-muted mt-1">
            Wählen Sie eine Datei zum Upload.
          </div>
        </div>
      )}

      {/* Upload-Button ─────────────────────────────────────────────── */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={handleUpload}
          className="sr-only"
          id="partner-logo-input"
        />
        <label
          htmlFor="partner-logo-input"
          className={
            'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-colors ' +
            (busy
              ? 'bg-surface-subtle text-text-muted'
              : 'bg-text-primary text-white hover:bg-indigo-700')
          }
        >
          {status === 'uploading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Wird hochgeladen…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> {logoUrl ? 'Logo ersetzen' : 'Logo hochladen'}
            </>
          )}
        </label>
      </div>

      {/* Statusmeldungen ──────────────────────────────────────────── */}
      {status === 'success' && (
        <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Vorschau ─────────────────────────────────────────────────── */}
      <div className="pt-4">
        <div className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
          Vorschau Report-Header
        </div>
        <div className="rounded-xl border border-border-default bg-white overflow-hidden">
          {/* Mock-Report-Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-8 w-auto max-w-[140px] object-contain" />
            ) : (
              <div className="text-base font-bold text-text-primary">{companyName}</div>
            )}
            <div className="text-xs text-text-muted">Referenz-Report · Beispiel</div>
          </div>
          <div className="p-5">
            <div className="text-sm text-text-secondary">Inhalt des Reports …</div>
          </div>
          {/* Mock-Report-Footer mit Siegel — UNENTFERNBAR */}
          <div className="px-5 py-3 bg-surface-subtle border-t border-border-default flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="text-xs text-text-secondary">
              verifiziert durch <strong className="text-text-primary">candiq</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
