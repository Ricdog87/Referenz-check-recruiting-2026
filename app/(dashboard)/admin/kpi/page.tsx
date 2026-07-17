import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { safeQuery } from '@/lib/safe-query'
import { isAdmin } from '@/lib/reviewer'
import { isKpiCockpitEnabled } from '@/lib/flags'
import { getKpiSnapshot, type KpiSnapshot } from '@/lib/kpi'
import {
  Euro, TrendingUp, Users, ClipboardList, Clock, Award,
  Handshake, Plug, Download, ShieldCheck, ArrowLeft,
} from 'lucide-react'

// Live-Kennzahlen — kein Caching.
export const dynamic = 'force-dynamic'

const EMPTY: KpiSnapshot = {
  generatedAt: '',
  mrr: 0, arr: 0, currency: '€',
  activePayingCustomers: 0, totalCustomers: 0, trialingCustomers: 0,
  checksTotal: 0, checksLast30Days: 0, completedChecks: 0,
  avgTurnaroundHours: null, credentialInventory: 0,
  partnerCustomers: 0, activePartnerCustomers: 0, zvooveLinkedCustomers: 0,
}

export default async function KpiCockpitPage() {
  // Flag-Gate zuerst: default off → Route existiert faktisch nicht.
  if (!isKpiCockpitEnabled()) notFound()

  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (!isAdmin(session)) redirect('/dashboard')

  const k = await safeQuery(getKpiSnapshot(), EMPTY, 'kpi.snapshot')

  const eur = (n: number) => `${n.toLocaleString('de-DE')} €`
  const turnaround =
    k.avgTurnaroundHours == null
      ? '—'
      : k.avgTurnaroundHours < 48
        ? `${k.avgTurnaroundHours.toFixed(1)} h`
        : `${(k.avgTurnaroundHours / 24).toFixed(1)} T`

  return (
    <div className="py-6 space-y-6">
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #4f46e5 100%)' }}
      >
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/70 mb-1">
          <ShieldCheck className="w-3.5 h-3.5" /> candiq · KPI-Cockpit · intern
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Geschäftskennzahlen</h1>
        <p className="text-sm text-white/70 mt-1">
          Server-seitig berechnet. Nur für das candiq-Team &amp; die DD sichtbar.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs font-semibold text-white/80 hover:text-white mt-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Zur Admin-Übersicht
        </Link>
      </div>

      {/* Umsatz */}
      <Section title="Umsatz" metric="revenue">
        <Stat icon={Euro} label="MRR" value={eur(k.mrr)} sub="aus aktiven Abos / Monat" />
        <Stat icon={TrendingUp} label="ARR" value={eur(k.arr)} sub="MRR × 12" />
        <Stat icon={Users} label="Zahlende Kunden" value={k.activePayingCustomers} sub={`${k.trialingCustomers} im Trial`} />
        <Stat icon={Users} label="Kunden gesamt" value={k.totalCustomers} sub="ohne interne Accounts" />
      </Section>

      {/* Prüfungen */}
      <Section title="Prüfungen & Betrieb" metric="summary">
        <Stat icon={ClipboardList} label="Checks gesamt" value={k.checksTotal} sub={`${k.completedChecks} abgeschlossen`} />
        <Stat icon={ClipboardList} label="Checks letzte 30 Tage" value={k.checksLast30Days} />
        <Stat icon={Clock} label="Ø Durchlaufzeit bis Report" value={turnaround} sub="Anlage → Freigabe" />
        <Stat icon={Award} label="Credential-Bestand" value={k.credentialInventory} sub="verifizierte, wiederverwendbare Profile" />
      </Section>

      {/* Partner & Integrationen */}
      <Section title="Partner & Integrationen">
        <Stat icon={Handshake} label="Partner-Kunden" value={k.partnerCustomers} sub={`${k.activePartnerCustomers} aktiv`} />
        <Stat icon={Plug} label="zvoove-verknüpft" value={k.zvooveLinkedCustomers} sub="Integration in PR #137, nicht aktiv" />
      </Section>

      {k.generatedAt && (
        <p className="text-[11px] text-text-muted">
          Stand: {new Date(k.generatedAt).toLocaleString('de-DE')}
        </p>
      )}
    </div>
  )
}

function Section({
  title,
  metric,
  children,
}: {
  title: string
  metric?: 'summary' | 'revenue'
  children: React.ReactNode
}) {
  return (
    <div className="card-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">{title}</h2>
        {metric && (
          <a
            href={`/api/admin/kpi/export?metric=${metric}`}
            className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </a>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: any
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="card-md p-4">
      <div className="flex items-center gap-2 text-text-muted text-[11px] font-semibold uppercase tracking-wide mb-2">
        <Icon className="w-4 h-4" /> {label}
      </div>
      <div className="text-2xl font-bold text-text-primary">{value}</div>
      {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
    </div>
  )
}
