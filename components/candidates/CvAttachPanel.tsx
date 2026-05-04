'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, Loader2, Sparkles, FileText, X, CheckCircle2, AlertCircle,
  Phone, Wand2, Plus,
} from 'lucide-react'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const PARSE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 4 * 1024 * 1024

type Employer = {
  employerName: string
  position: string
  startDate: string
  endDate: string
  current: boolean
}

interface Props {
  candidateId: string
  /** Set of employer names already in this candidate's checks — for de-dup */
  existingEmployers: string[]
}

export function CvAttachPanel({ candidateId, existingEmployers }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [suggestedEmployers, setSuggestedEmployers] = useState<Employer[] | null>(null)
  const [creatingCheckIdx, setCreatingCheckIdx] = useState<number | null>(null)
  const [createdIdxs, setCreatedIdxs] = useState<Set<number>>(new Set())

  function reset() {
    setError(null)
    setSuccess(null)
    setSuggestedEmployers(null)
    setCreatedIdxs(new Set())
  }

  async function handleFile(file: File) {
    reset()
    if (file.size === 0) { setError('Datei ist leer.'); return }
    if (file.size > MAX_BYTES) { setError(`Datei zu groß (max. ${MAX_BYTES / 1024 / 1024} MB).`); return }
    if (!ALLOWED_TYPES.includes(file.type)) { setError('Format nicht unterstützt. PDF, DOC, DOCX, JPG oder PNG.'); return }

    // 1) Datei anhängen via /api/upload
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('candidateId', candidateId)
      fd.append('type', 'CV')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Upload fehlgeschlagen.')
      }
      setSuccess(`„${file.name}" wurde angehängt.`)
    } catch (e: any) {
      setError(e.message ?? 'Upload fehlgeschlagen.')
      setUploading(false)
      return
    } finally {
      setUploading(false)
    }

    // 2) Wenn parse-fähiges Format, Auto-Analyse triggern
    if (PARSE_TYPES.includes(file.type)) {
      setParsing(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/candidates/parse', { method: 'POST', body: fd })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          // Parse failed — Datei ist trotzdem angehängt, nur Vorschläge fehlen.
          // Stille Verarbeitung, kein Hard-Error.
          setParsing(false)
          router.refresh()
          return
        }
        const employers: Employer[] = data.data?.previousEmployers ?? []
        const existing = new Set(existingEmployers.map((e) => e.toLowerCase().trim()))
        const fresh = employers.filter(
          (e) => e.employerName && !existing.has(e.employerName.toLowerCase().trim()),
        )
        if (fresh.length > 0) {
          setSuggestedEmployers(fresh)
        }
      } catch {
        // Stiller Fail — Datei ist trotzdem angehängt
      } finally {
        setParsing(false)
      }
    }
    router.refresh()
  }

  async function createCheck(idx: number, emp: Employer) {
    setCreatingCheckIdx(idx)
    try {
      const res = await fetch('/api/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          employerName: emp.employerName,
          position: emp.position,
          startDate: emp.startDate,
          endDate: emp.current ? '' : emp.endDate,
        }),
      })
      if (res.ok) {
        setCreatedIdxs((prev) => new Set(prev).add(idx))
        router.refresh()
      }
    } finally {
      setCreatingCheckIdx(null)
    }
  }

  async function createAllChecks() {
    if (!suggestedEmployers) return
    setCreatingCheckIdx(-1)
    try {
      await Promise.all(
        suggestedEmployers.map((emp, idx) =>
          createdIdxs.has(idx) ? Promise.resolve() :
          fetch('/api/checks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              candidateId,
              employerName: emp.employerName,
              position: emp.position,
              startDate: emp.startDate,
              endDate: emp.current ? '' : emp.endDate,
            }),
          }).then((r) => r.ok ? idx : null),
        ),
      )
      setCreatedIdxs(new Set(suggestedEmployers.map((_, i) => i)))
      router.refresh()
    } finally {
      setCreatingCheckIdx(null)
    }
  }

  return (
    <div className={`rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
      dragOver ? 'border-brand-500 bg-brand-50/50' : 'border-border bg-bg-secondary/30 hover:border-brand-300'
    }`}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) handleFile(f)
        }}
        className="p-5 text-center"
      >
        {uploading || parsing ? (
          <div className="flex flex-col items-center gap-2 py-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center text-white">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div className="text-xs font-bold text-text-primary">
              {uploading ? 'Datei wird hochgeladen…' : 'CV wird analysiert…'}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center text-white">
              <Wand2 className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              CV / Zeugnis nachreichen
            </div>
            <div className="text-[11px] text-text-secondary max-w-md leading-relaxed">
              Wir hängen die Datei an und schlagen — falls neue Arbeitgeber im CV stehen — direkt
              passende Referenz-Checks vor.
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary mt-1 text-xs py-2"
            >
              <Upload className="w-3.5 h-3.5" /> Datei wählen oder hier ablegen
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            // reset input so the same file can be uploaded again
            e.target.value = ''
          }}
        />
      </div>

      {(error || success) && (
        <div className={`px-4 py-2.5 text-xs flex items-start gap-2 ${
          error ? 'bg-rose-50 text-rose-700 border-t border-rose-200' : 'bg-emerald-50 text-emerald-700 border-t border-emerald-200'
        }`}>
          {error
            ? <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            : <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
          <span className="flex-1">{error ?? success}</span>
          <button onClick={reset} className="text-text-muted hover:text-text-primary" aria-label="Schließen">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Vorschläge für neue Referenz-Checks */}
      {suggestedEmployers && suggestedEmployers.length > 0 && (
        <div className="bg-white border-t border-border p-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-xs font-bold text-text-primary">
                {suggestedEmployers.length} neue Arbeitgeber im CV
              </span>
            </div>
            {createdIdxs.size < suggestedEmployers.length && (
              <button
                type="button"
                onClick={createAllChecks}
                disabled={creatingCheckIdx !== null}
                className="text-[10px] font-bold text-brand-700 hover:text-brand-800 disabled:opacity-50"
              >
                Alle anlegen →
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {suggestedEmployers.map((emp, idx) => {
              const created = createdIdxs.has(idx)
              const loading = creatingCheckIdx === idx
              return (
                <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                  created ? 'bg-emerald-50/60 border-emerald-200' : 'bg-bg-secondary border-border'
                }`}>
                  <FileText className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-text-primary truncate">{emp.employerName}</div>
                    <div className="text-[10px] text-text-muted truncate">
                      {emp.position}
                      {(emp.startDate || emp.endDate) && (
                        <> · {emp.startDate || '?'} – {emp.current ? 'heute' : (emp.endDate || '?')}</>
                      )}
                    </div>
                  </div>
                  {created ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" /> angelegt
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => createCheck(idx, emp)}
                      disabled={loading || creatingCheckIdx === -1}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 hover:text-brand-800 px-2 py-1 rounded-full bg-white border border-border hover:border-brand-300 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Anlegen
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
