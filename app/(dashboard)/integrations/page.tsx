import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/layout/Header'
import { getPlanById } from '@/lib/utils'
import { Plug, Mail, Lock, Sparkles, ArrowRight, Code2, Webhook, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

// Status-Politik (Stand 2026-06):
// - REST-API ist heute live: alle Dashboard-Aktionen sind via /api/**
//   über Session-Cookie ansprechbar (Doku unter /integrations/api).
// - Incoming-Webhooks für Stripe sind live (Billing-Events).
// - ATS-/HRIS-Integrationen (Personio, SAP SF, Workday, Greenhouse,
//   Workable, Recruitee) sind in Vorbereitung; Roadmap-Ziel: Q4 2026.
// - Collaboration (Slack, Teams, Zapier): kommt nach den ATS-Konnektoren.
//
// Wir markieren Items ehrlich: "Verfuegbar" nur wenn ein klickbarer
// Endpoint/Doku existiert, sonst klar "Roadmap Q4 2026".

type IntegrationStatus = 'available' | 'roadmap'

type Integration = {
  name: string
  cat: string
  desc: string
  status: IntegrationStatus
  href?: string
  note?: string
}

const CANDIQ_PLATFORM: Integration[] = [
  {
    name: 'REST-API',
    cat: 'Developer',
    desc: 'Alle Dashboard-Funktionen via JSON-API: Kandidaten, Prüfungen, Reports, Audit-Trail. Doku mit curl-Beispielen.',
    status: 'available',
    href: '/integrations/api',
  },
  {
    name: 'Stripe (Incoming-Webhooks)',
    cat: 'Billing',
    desc: 'Live-Anbindung an Stripe Checkout & Subscriptions. Add-on-Buchungen, Express-24h-Aktivierung, Subscription-Status.',
    status: 'available',
    href: '/settings/billing',
  },
]

const ATS: Integration[] = [
  {
    name: 'Personio',
    cat: 'ATS / HRIS',
    desc: 'Bidirektionaler Kandidaten-Sync. Bewerberprofile aus Personio, Status-Updates zurueck.',
    status: 'roadmap',
    note: 'Q4 2026',
  },
  {
    name: 'SAP SuccessFactors',
    cat: 'HRIS',
    desc: 'Enterprise-Integration. Kandidatendaten und Stellen, OData-API.',
    status: 'roadmap',
    note: 'Q4 2026',
  },
  {
    name: 'Workday',
    cat: 'HRIS',
    desc: 'Konzern-tauglich. Workday-Marketplace-Eintrag geplant.',
    status: 'roadmap',
    note: 'Q1 2027',
  },
  {
    name: 'Greenhouse',
    cat: 'ATS',
    desc: 'Webhook + REST-API. Automatischer Trigger von Reference-Checks beim Stage-Wechsel.',
    status: 'roadmap',
    note: 'Q4 2026',
  },
  {
    name: 'Workable',
    cat: 'ATS',
    desc: 'Direkter Job-Sync, Kandidaten-Status-Updates.',
    status: 'roadmap',
    note: 'Q4 2026',
  },
  {
    name: 'Recruitee',
    cat: 'ATS',
    desc: 'Beliebt im DACH-Mittelstand. Bidirektionaler Sync via API.',
    status: 'roadmap',
    note: 'Q4 2026',
  },
]

const COLLAB: Integration[] = [
  {
    name: 'Outgoing-Webhooks',
    cat: 'Developer',
    desc: 'Eure Systeme empfangen Events: candidate.created, check.completed, consent.revoked. Konfiguration pro Workspace.',
    status: 'roadmap',
    note: 'Q4 2026',
  },
  {
    name: 'Slack',
    cat: 'Notifications',
    desc: 'Echtzeit-Updates bei Statuswechseln, Diskrepanzen, Abschlüssen.',
    status: 'roadmap',
    note: 'Q4 2026',
  },
  {
    name: 'Microsoft Teams',
    cat: 'Notifications',
    desc: 'Adaptive Cards für Hiring Manager direkt im Teams-Kanal.',
    status: 'roadmap',
    note: 'Q1 2027',
  },
  {
    name: 'Zapier',
    cat: 'No-Code',
    desc: 'Mehrere tausend Apps via Zapier-Trigger und -Aktionen.',
    status: 'roadmap',
    note: 'Q4 2026',
  },
]

// Plan-Gate: Integrationen-Page ist ein Business-Tier-Feature.
const PLANS_WITH_INTEGRATIONS = new Set([
  'BUSINESS',
  'ENTERPRISE',
  'AGENCY_PRO',
  'AGENCY_SCALE',
])

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const currentPlan = session.user.plan ?? 'STARTER'
  const hasAccess = PLANS_WITH_INTEGRATIONS.has(currentPlan)

  if (!hasAccess) {
    return <PlanGate currentPlan={currentPlan} />
  }

  const availableCount = [...CANDIQ_PLATFORM, ...ATS, ...COLLAB].filter(
    (i) => i.status === 'available',
  ).length

  return (
    <>
      <Header
        title="Integrationen"
        subtitle={`${availableCount} verfuegbar · weitere Konnektoren auf der Roadmap`}
      />
      <div className="space-y-8">
        {/* Ehrlicher Status-Hinweis statt „alles soon" */}
        <div className="card-md bg-gradient-to-br from-emerald-50/60 to-white border-emerald-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Heute nutzbar:</strong>{' '}
              REST-API mit voller Funktionsabdeckung (Kandidaten, Prüfungen,
              Reports, Audit) und Live-Stripe-Webhooks für Abrechnung.
              <br />
              <strong className="text-text-primary">In Vorbereitung (Q4 2026):</strong>{' '}
              Native ATS-Konnektoren — Personio &amp; Greenhouse zuerst. Welches
              ATS habt ihr im Einsatz? Mail an{' '}
              <a href="mailto:hello@candiq.de" className="text-brand-700 font-semibold">
                hello@candiq.de
              </a>
              {' '}priorisiert die Reihenfolge.
            </div>
          </div>
        </div>

        <Section title="Candiq-Plattform" items={CANDIQ_PLATFORM} />
        <Section title="ATS &amp; HRIS" items={ATS} />
        <Section title="Notifications &amp; Automation" items={COLLAB} />

        <div className="card-md flex items-center justify-between gap-4 bg-gradient-to-br from-brand-50/60 to-white border-brand-100">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center text-white shadow-card flex-shrink-0">
              <Plug className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">Eigene Integration entwickeln?</div>
              <div className="text-xs text-text-secondary">
                Heute via REST-API + Session-Cookie. API-Key-System für headless
                Calls ist auf der Roadmap.
              </div>
            </div>
          </div>
          <Link href="/integrations/api" className="btn-secondary text-xs whitespace-nowrap">
            <Code2 className="w-3.5 h-3.5" /> API-Doku öffnen
          </Link>
        </div>
      </div>
    </>
  )
}

function Section({ title, items }: { title: string; items: Integration[] }) {
  return (
    <div>
      <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3" dangerouslySetInnerHTML={{ __html: title }} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <IntegrationCard key={it.name} item={it} />
        ))}
      </div>
    </div>
  )
}

function IntegrationCard({ item }: { item: Integration }) {
  const isAvailable = item.status === 'available'
  return (
    <div className={`card-md group ${isAvailable ? 'border-emerald-200/80' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-11 h-11 rounded-xl border flex items-center justify-center font-bold ${
            isAvailable
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-bg-secondary border-border text-text-secondary'
          }`}
        >
          {item.name === 'REST-API' ? (
            <Code2 className="w-5 h-5" />
          ) : item.name === 'Outgoing-Webhooks' ? (
            <Webhook className="w-5 h-5" />
          ) : (
            item.name[0]
          )}
        </div>
        {isAvailable ? (
          <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
            Verfuegbar
          </span>
        ) : (
          <span className="badge bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
            {item.note ?? 'Roadmap'}
          </span>
        )}
      </div>
      <div className="font-semibold text-text-primary mb-1">{item.name}</div>
      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">{item.cat}</div>
      <p className="text-xs text-text-secondary leading-relaxed mb-4">{item.desc}</p>
      {isAvailable && item.href ? (
        <Link
          href={item.href}
          className="block w-full text-xs font-semibold py-2 rounded-full transition-all bg-emerald-600 hover:bg-emerald-700 text-white text-center"
        >
          Öffnen
        </Link>
      ) : (
        <button
          disabled
          className="w-full text-xs font-semibold py-2 rounded-full transition-all bg-bg-tertiary text-text-muted cursor-not-allowed"
        >
          {item.note ?? 'Roadmap'}
        </button>
      )}
    </div>
  )
}

// ── Paywall ─────────────────────────────────────────────────────────
function PlanGate({ currentPlan }: { currentPlan: string }) {
  const planMeta = getPlanById(currentPlan)
  return (
    <>
      <Header title="Integrationen" subtitle="Verbinden Sie candiq mit Ihrem Tech-Stack" />
      <div className="card-lg max-w-2xl mx-auto text-center mt-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center mx-auto mb-5 text-white shadow-card">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
          Integrationen sind Teil des Business-Pakets
        </h1>
        <p className="text-sm text-text-secondary mb-6 leading-relaxed max-w-md mx-auto">
          Ihr aktueller Plan ist <strong className="text-text-primary">{planMeta.name}</strong>.
          REST-API, Stripe-Webhooks und (geplant) ATS-Konnektoren sind ab dem
          <strong className="text-text-primary"> Business-Plan</strong> nutzbar.
        </p>

        <div className="card-md bg-gradient-to-br from-brand-50 to-violet/5 border-brand-100 mb-6 text-left max-w-md mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-700 mb-2">Business inkludiert</div>
          <ul className="space-y-1.5 text-xs text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
              <span>REST-API (heute live, mit curl-Doku)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
              <span>Stripe-Webhook für Abrechnung</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold mt-0.5">○</span>
              <span>ATS-Konnektoren (Personio, SAP SF, Workday) — Roadmap Q4 2026</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold mt-0.5">○</span>
              <span>Slack &amp; Teams-Notifications — Roadmap Q4 2026/Q1 2027</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
              <span>35 Referenzpruefungen / Monat, 15 Nutzer-Sitze</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <Link href="/preise" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4" />
            Zu den Plaenen
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="mailto:hello@candiq.de?subject=Upgrade%20auf%20Business"
            className="btn-secondary text-sm"
          >
            <Mail className="w-4 h-4" />
            Mit Sales sprechen
          </a>
        </div>
      </div>
    </>
  )
}
