'use client'

import { useEffect, useMemo, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Puzzle, Lock, Sparkles, ArrowRight, Loader2 } from 'lucide-react'

type Addon = {
  key: string
  name: string
  desc: string
  defaultStatus: 'Live' | 'Beta' | 'Bald verfügbar'
  active: boolean
  orderStatus: string | null
  seats: number
}

export default function AddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([])
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [storeReady, setStoreReady] = useState(true)

  useEffect(() => {
    fetch('/api/addons')
      .then((r) => r.json())
      .then((d) => {
        setAddons(d.addons ?? [])
        setStoreReady(d.storeReady ?? true)
      })
      .catch(() => setMessage('Add-ons konnten nicht geladen werden.'))
      .finally(() => setLoading(false))
  }, [])

  const activeOrders = useMemo(
    () => addons.filter((a) => a.active && ['ACTIVE', 'TRIAL'].includes(a.orderStatus ?? '')).length,
    [addons]
  )

  async function activateAddon(addonKey: string) {
    setMessage('')
    setBusyKey(addonKey)
    try {
      const res = await fetch('/api/addons/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addonKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Aktivierung fehlgeschlagen.')

      setAddons((prev) => prev.map((a) => (a.key === addonKey ? { ...a, active: true, orderStatus: 'ACTIVE', seats: 1 } : a)))
      setMessage(`${data.order.addonName} wurde aktiviert.`)
    } catch (e: any) {
      setMessage(e.message || 'Aktivierung fehlgeschlagen.')
    } finally {
      setBusyKey(null)
    }
  }

  async function deactivateAddon(addonKey: string) {
    setMessage('')
    setBusyKey(addonKey)
    try {
      const res = await fetch('/api/addons/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addonKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Deaktivierung fehlgeschlagen.')

      const addonName = addons.find((a) => a.key === addonKey)?.name ?? addonKey
      setAddons((prev) => prev.map((a) => (a.key === addonKey ? { ...a, active: false, orderStatus: 'CANCELED', seats: 0 } : a)))
      setMessage(`${addonName} wurde deaktiviert.`)
    } catch (e: any) {
      setMessage(e.message || 'Deaktivierung fehlgeschlagen.')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <>
      <Header
        title="Add-on Marketplace"
        subtitle="Erweitern Sie candiq mit modularen Services für Qualität, Geschwindigkeit und Compliance"
      />

      <div className="space-y-5">
        <div className="card-md bg-gradient-to-br from-brand-50/70 to-white border-brand-100 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center text-white shadow-card flex-shrink-0">
            <Puzzle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary mb-1">Marketplace für Recruiting-Teams</div>
            <p className="text-xs text-text-secondary leading-relaxed max-w-3xl">
              Aktivieren Sie Add-ons pro Workspace und kombinieren Sie sie mit Ihren bestehenden candiq-Paketen.
              Abrechnung erfolgt transparent je Add-on und Nutzungsumfang.
            </p>
            <div className="mt-2 text-[11px] text-text-muted">
              Aktive Add-ons in Ihrem Workspace: <span className="font-semibold text-text-primary">{activeOrders}</span>
            </div>
            {message && <div className="text-xs text-brand-700 mt-2">{message}</div>}
            {!storeReady && (
              <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 inline-block">
                Hinweis: Add-on-Datenbank noch nicht migriert. Aktivierungen sind eingeschränkt.
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="card-md flex items-center justify-center py-10 text-text-muted text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Add-ons werden geladen…
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {addons.map((a) => (
              <div key={a.key} className="card-md">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="text-sm font-semibold text-text-primary">{a.name}</div>
                  <span className={`badge text-[10px] ${
                    a.active
                      ? 'badge-success'
                      : a.defaultStatus === 'Beta'
                        ? 'badge-warning'
                        : a.defaultStatus === 'Live'
                          ? 'bg-brand-50 text-brand-700 border border-brand-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>{a.active ? 'Aktiv' : a.defaultStatus}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">{a.desc}</p>

                {a.active ? (
                  <div className="space-y-2">
                    <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      Aktiv im Workspace (Sitze: {a.seats})
                    </div>
                    <button
                      className="btn-secondary text-xs w-full"
                      disabled={busyKey === a.key}
                      onClick={() => deactivateAddon(a.key)}
                    >
                      {busyKey === a.key ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deaktiviere…</> : <>Deaktivieren <Lock className="w-3.5 h-3.5" /></>}
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-secondary text-xs w-full"
                    disabled={a.defaultStatus === 'Bald verfügbar' || busyKey === a.key}
                    onClick={() => activateAddon(a.key)}
                  >
                    {busyKey === a.key
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Aktiviere…</>
                      : a.defaultStatus === 'Bald verfügbar'
                        ? <><Lock className="w-3.5 h-3.5" /> Demnächst</>
                        : <>Aktivieren <ArrowRight className="w-3.5 h-3.5" /></>}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="card-md flex items-center justify-between gap-4">
          <div className="text-sm text-text-secondary">
            Fehlt ein Add-on? Schreiben Sie uns Ihren Wunsch-Workflow für die Roadmap.
          </div>
          <a href="mailto:hello@candiq.de" className="btn-primary text-xs">
            <Sparkles className="w-3.5 h-3.5" /> Add-on vorschlagen
          </a>
        </div>
      </div>
    </>
  )
}
