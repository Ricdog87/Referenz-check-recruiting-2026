'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react'

/**
 * Admin-Tabelle: Per-Partner-EK-Overrides je Plan.
 *
 * EINHEITEN: alle Beträge sind Monatsraten — „jährl. Zahlweise" ist die
 * günstigere Monatsrate bei jährlicher Abrechnung, KEINE Jahressumme.
 * Ein gesetzter Override schlägt die Tier-Formel (siehe lib/partner/pricing.ts).
 */

export type PricingRow = {
  planKey: string
  planName: string
  listMonthlyCents: number
  listAnnualCents: number
  tierEkMonthlyCents: number
  tierEkAnnualCents: number
  overrideMonthlyCents: number | null
  overrideAnnualCents: number | null
}

export function PartnerPricingOverrides({
  partnerId,
  tier,
  ekDiscountPct,
  rows,
}: {
  partnerId: string
  tier: string
  ekDiscountPct: number
  rows: PricingRow[]
}) {
  return (
    <div className="card-md p-0 overflow-x-auto">
      <div className="px-4 py-3 border-b border-border-default flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-text-primary">EK-Konditionen (Overrides)</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Tier <strong>{tier}</strong> = {ekDiscountPct}% Discount auf Listenpreis.
            Ein Override ersetzt die Formel für diesen Plan. Alle Beträge sind{' '}
            <strong>Monatsraten</strong>. Wirkt nur auf künftige Mandanten (EK-Snapshot).
          </p>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-text-muted">
          <tr>
            <th className="text-left px-4 py-3 font-semibold">Plan</th>
            <th className="text-right px-4 py-3 font-semibold">Liste / Mo.</th>
            <th className="text-right px-4 py-3 font-semibold">Tier-EK / Mo.</th>
            <th className="text-right px-4 py-3 font-semibold">Override / Mo. (€)</th>
            <th className="text-right px-4 py-3 font-semibold">Override / Mo. jährl. Zw. (€)</th>
            <th className="text-right px-4 py-3 font-semibold">Aktion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {rows.map((row) => (
            <OverrideRow key={row.planKey} partnerId={partnerId} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function centsToEuroInput(cents: number | null): string {
  return cents === null ? '' : (cents / 100).toFixed(2)
}

/**
 * Parst Euro-Eingaben strikt in Cents. Akzeptiert:
 *   "1234" · "1234,56" · "1234.56" · "1.234,56" (dt. Tausenderpunkte)
 * Alles andere → NaN (Aufrufer blockt). Insbesondere darf "1.234" NIEMALS
 * als 1,234 € interpretiert werden (Number("1.234") === 1.234 → Faktor-1000-
 * Fehler beim EK!) — mit Punkt UND ohne Komma sind max. 2 Nachkommastellen
 * erlaubt, sonst gilt es als (abgelehnte) mehrdeutige Eingabe.
 */
function euroInputToCents(v: string): number | null {
  const trimmed = v.trim()
  if (!trimmed) return null

  let normalized: string
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(trimmed)) {
    // Deutsches Format mit Tausenderpunkten: 1.234 / 1.234,56
    normalized = trimmed.replace(/\./g, '').replace(',', '.')
  } else if (/^\d+(,\d{1,2})?$/.test(trimmed)) {
    // Komma-Dezimal: 1234,56
    normalized = trimmed.replace(',', '.')
  } else if (/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    // Punkt-Dezimal (max 2 Stellen): 1234.56 — "1.234" fällt NICHT hierunter
    normalized = trimmed
  } else {
    return NaN as unknown as number
  }

  const n = Number(normalized)
  if (!Number.isFinite(n) || n <= 0) return NaN as unknown as number
  return Math.round(n * 100)
}

function OverrideRow({ partnerId, row }: { partnerId: string; row: PricingRow }) {
  const router = useRouter()
  const [monthly, setMonthly] = useState(centsToEuroInput(row.overrideMonthlyCents))
  const [annual, setAnnual] = useState(centsToEuroInput(row.overrideAnnualCents))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [, startTransition] = useTransition()

  const hasOverride = row.overrideMonthlyCents !== null || row.overrideAnnualCents !== null
  const dirty =
    monthly !== centsToEuroInput(row.overrideMonthlyCents) ||
    annual !== centsToEuroInput(row.overrideAnnualCents)

  async function submit(clear: boolean) {
    const monthlyCents = clear ? null : euroInputToCents(monthly)
    const annualCents = clear ? null : euroInputToCents(annual)
    if (!clear && (Number.isNaN(monthlyCents) || Number.isNaN(annualCents))) {
      setMsg({ tone: 'error', text: 'Ungültiger Betrag.' })
      return
    }
    if (!clear && monthlyCents === null && annualCents === null) {
      setMsg({ tone: 'error', text: 'Mindestens ein Wert — oder „Formel" zum Zurücksetzen.' })
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey: row.planKey,
          baseEkMonthlyCents: clear ? null : monthlyCents,
          baseEkAnnualCents: clear ? null : annualCents,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ tone: 'error', text: data.error ?? 'Fehlgeschlagen.' })
        return
      }
      if (clear) {
        setMonthly('')
        setAnnual('')
      }
      setMsg({ tone: 'ok', text: clear ? 'Formel gilt wieder.' : 'Override gespeichert.' })
      startTransition(() => router.refresh())
    } catch {
      setMsg({ tone: 'error', text: 'Netzwerk-Fehler.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <tr className="hover:bg-surface-subtle/40 align-top">
      <td className="px-4 py-3">
        <div className="font-medium text-text-primary">{row.planName}</div>
        <div className="text-[10px] text-text-muted"><code>{row.planKey}</code></div>
        {msg && (
          <div
            className={
              'mt-1.5 inline-flex items-start gap-1 text-[11px] ' +
              (msg.tone === 'ok' ? 'text-emerald-700' : 'text-red-700')
            }
          >
            {msg.tone === 'ok' ? (
              <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            )}
            {msg.text}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right text-xs text-text-secondary whitespace-nowrap">
        {(row.listMonthlyCents / 100).toFixed(2).replace('.', ',')} €
        <div className="text-[10px] text-text-muted">
          jz. {(row.listAnnualCents / 100).toFixed(2).replace('.', ',')} €
        </div>
      </td>
      {/* Durchstreichen PRO Cycle: ein Override nur für monatlich lässt die
          jährliche Zahlweise weiterhin über die Tier-Formel laufen. */}
      <td className="px-4 py-3 text-right text-xs whitespace-nowrap">
        <span className={row.overrideMonthlyCents !== null ? 'text-text-muted line-through' : 'text-indigo-700 font-semibold'}>
          {(row.tierEkMonthlyCents / 100).toFixed(2).replace('.', ',')} €
        </span>
        <div className={'text-[10px] ' + (row.overrideAnnualCents !== null ? 'text-text-muted line-through' : 'text-indigo-600')}>
          jz. {(row.tierEkAnnualCents / 100).toFixed(2).replace('.', ',')} €
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <input
          type="text"
          inputMode="decimal"
          value={monthly}
          onChange={(e) => setMonthly(e.target.value)}
          placeholder="—"
          className="w-24 px-2 py-1 text-xs text-right rounded border border-border-default focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <input
          type="text"
          inputMode="decimal"
          value={annual}
          onChange={(e) => setAnnual(e.target.value)}
          placeholder="—"
          className="w-24 px-2 py-1 text-xs text-right rounded border border-border-default focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={busy || !dirty}
          title="Override speichern"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 mr-1.5"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={busy || !hasOverride}
          title="Override löschen — Tier-Formel gilt wieder"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border border-border-default text-text-secondary hover:bg-surface-subtle disabled:opacity-40"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  )
}
