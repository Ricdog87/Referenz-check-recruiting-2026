'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RefreshCw, Send, CheckCircle2, Loader2, Download } from 'lucide-react'

type LinkedCheck = { id: string; employerName: string; status: string; result: string | null }
type LinkedCandidate = {
  id: string
  name: string
  position: string
  status: string
  gdprConsent: boolean
  zvooveId: string
  checks: LinkedCheck[]
}

export function ZvooveConsole({
  demo,
  connected,
  candidates,
}: {
  demo: boolean
  connected: boolean
  candidates: LinkedCandidate[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function runImport() {
    setBusy('import')
    setMsg(null)
    try {
      const res = await fetch('/api/integrations/zvoove/import', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Import fehlgeschlagen.')
      setMsg({ ok: true, text: `Import: ${data.imported} neu, ${data.skipped} übersprungen, ${data.failed} Fehler.` })
      router.refresh()
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? 'Fehler.' })
    } finally {
      setBusy(null)
    }
  }

  async function pushResult(checkId: string) {
    setBusy(`push:${checkId}`)
    setMsg(null)
    try {
      const res = await fetch('/api/integrations/zvoove/push-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Rückschreiben fehlgeschlagen.')
      setMsg({ ok: true, text: 'Ergebnis an zvoove zurückgeschrieben.' })
      router.refresh()
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? 'Fehler.' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="card-md flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-text-secondary">
          {demo ? (
            <>
              <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider mr-2">
                Demo-Modus
              </span>
              Import aus synthetischer Mock-Gegenstelle — keine echten zvoove-Daten.
            </>
          ) : connected ? (
            <>
              <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider mr-2">
                Verbunden
              </span>
              zvoove-Tenant aktiv.
            </>
          ) : (
            <>
              <span className="badge bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-wider mr-2">
                Nicht verbunden
              </span>
              Bitte zuerst einen zvoove-Tenant verbinden.
            </>
          )}
        </div>
        <button
          type="button"
          onClick={runImport}
          disabled={busy !== null || (!demo && !connected)}
          className="btn-primary text-xs inline-flex items-center gap-2 disabled:opacity-60"
        >
          {busy === 'import' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Aus zvoove importieren
        </button>
      </div>

      {msg && (
        <div
          className={`card-md text-xs ${msg.ok ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800' : 'border-rose-200 bg-rose-50/50 text-rose-800'}`}
        >
          {msg.text}
        </div>
      )}

      <div className="card-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="w-4 h-4 text-brand-600" />
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">zvoove-verknüpfte Kandidaten</h2>
        </div>
        {candidates.length === 0 ? (
          <p className="text-sm text-text-muted">Noch nichts importiert. &bdquo;Aus zvoove importieren&ldquo; starten.</p>
        ) : (
          <ul className="space-y-3">
            {candidates.map((c) => (
              <li key={c.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/candidates/${c.id}`} className="text-sm font-semibold text-text-primary hover:text-brand-700 truncate">
                      {c.name}
                    </Link>
                    <div className="text-xs text-text-muted truncate">
                      {c.position} · zvoove {c.zvooveId} ·{' '}
                      {c.gdprConsent ? 'Einwilligung erteilt' : 'wartet auf Einwilligung'}
                    </div>
                  </div>
                  <span className="text-[11px] text-text-muted flex-shrink-0">{c.status}</span>
                </div>
                {c.checks.length > 0 && (
                  <ul className="mt-2 space-y-1.5 border-t border-border pt-2">
                    {c.checks.map((ch) => (
                      <li key={ch.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-text-secondary truncate">
                          {ch.employerName} · {ch.status}
                          {ch.result ? ` · ${ch.result}` : ''}
                        </span>
                        {ch.status === 'COMPLETED' ? (
                          <button
                            type="button"
                            onClick={() => pushResult(ch.id)}
                            disabled={busy !== null}
                            className="btn-secondary text-[11px] inline-flex items-center gap-1 disabled:opacity-60 flex-shrink-0"
                          >
                            {busy === `push:${ch.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            An zvoove
                          </button>
                        ) : (
                          <span className="text-[11px] text-text-muted flex items-center gap-1 flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> offen
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
