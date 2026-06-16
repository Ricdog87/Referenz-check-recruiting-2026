import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/layout/Header'
import { getPlanById } from '@/lib/utils'
import { Plug, Mail, Lock, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// Status-Politik: ALLE Integrationen sind aktuell "soon".
// ATS-Integrationen werden mit Phase 2 des Roadmaps freigeschaltet
// (Personio zuerst, dann Greenhouse/Workable). Bis dahin signalisiert
// "Demnaechst", dass die Integration kommt — aber noch nicht bestellbar
// ist. Verhindert falsche Erwartungen beim Verkauf.
const ATS = [
  { name: 'Personio', cat: 'ATS / HRIS', desc: 'Kandidaten-Sync mit Personio. Ein-Klick-Import von Bewerberprofilen.' },
  { name: 'SAP SuccessFactors', cat: 'HRIS', desc: 'Enterprise-Integration für globale HR-Teams. Kandidatendaten, Stellenangebote.' },
  { name: 'Workday', cat: 'HRIS', desc: 'Konzern-tauglich. Einsehbar im Workday Marketplace.' },
  { name: 'Greenhouse', cat: 'ATS', desc: 'Webhook + REST API. Automatisches Triggering von Reference-Checks.' },
  { name: 'Workable', cat: 'ATS', desc: 'Direkter Job-Sync und Kandidaten-Status-Updates.' },
  { name: 'Recruitee', cat: 'ATS', desc: 'Beliebt im DACH-Mittelstand. Bidirektionaler Sync.' },
]

const COLLAB = [
  { name: 'Slack', cat: 'Notifications', desc: 'Echtzeit-Updates bei Status-Änderungen, Diskrepanzen, Abschluss.' },
  { name: 'Microsoft Teams', cat: 'Notifications', desc: 'Adaptive Cards für Hiring Manager, ohne Tool-Wechsel.' },
  { name: 'Zapier', cat: 'No-Code', desc: 'Mehrere tausend Apps via Zapier-Trigger.' },
]

// Plan-Gate: Integrationen sind ein Business-Tier-Feature.
// HR:     BUSINESS, ENTERPRISE
// Agency: AGENCY_PRO, AGENCY_SCALE
// Andere Tiere sehen den Upgrade-Prompt.
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

  return (
    <>
      <Header title="Integrationen" subtitle="Verbinden Sie candiq mit Ihrem Tech-Stack" />
      <div className="space-y-8">
        <div className="card-md bg-gradient-to-br from-amber-50/80 to-white border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-xs text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Roadmap-Status:</strong> Alle Integrationen sind in
              aktiver Entwicklung und werden in den kommenden Wochen schrittweise freigeschaltet.
              Wünschen Sie sich eine spezifische Integration als Erstes? Schreiben Sie uns kurz an{' '}
              <a href="mailto:hello@candiq.de" className="text-brand-700 font-semibold">hello@candiq.de</a>
              {' '}— Kunden-Wünsche priorisieren die Roadmap.
            </div>
          </div>
        </div>

        <Section title="ATS & HRIS" items={ATS} />
        <Section title="Collaboration" items={COLLAB} />

        <div className="card-md flex items-center justify-between gap-4 bg-gradient-to-br from-brand-50/60 to-white border-brand-100">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center text-white shadow-card flex-shrink-0">
              <Plug className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">Eigene Integration entwickeln?</div>
              <div className="text-xs text-text-secondary">REST-API, Webhooks und OpenAPI-Spec verfügbar.</div>
            </div>
          </div>
          <a href="mailto:hello@candiq.de?subject=API-Zugang%20anfragen" className="btn-secondary text-xs">
            <Mail className="w-3.5 h-3.5" /> API-Zugang anfragen
          </a>
        </div>
      </div>
    </>
  )
}

function Section({ title, items }: { title: string; items: typeof ATS }) {
  return (
    <div>
      <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">{title}</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <div key={it.name} className="card-md group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-bg-secondary border border-border flex items-center justify-center text-text-secondary font-bold">
                {it.name[0]}
              </div>
              <span className="badge bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">Demnächst</span>
            </div>
            <div className="font-semibold text-text-primary mb-1">{it.name}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">{it.cat}</div>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">{it.desc}</p>
            <button
              disabled
              className="w-full text-xs font-semibold py-2 rounded-full transition-all bg-bg-tertiary text-text-muted cursor-not-allowed"
            >
              Demnächst
            </button>
          </div>
        ))}
      </div>
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
          Personio, SAP SuccessFactors, Workday, Slack, Teams & Co. sind ab dem
          <strong className="text-text-primary"> Business-Plan</strong> nutzbar.
        </p>

        <div className="card-md bg-gradient-to-br from-brand-50 to-violet/5 border-brand-100 mb-6 text-left max-w-md mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-700 mb-2">Business inkludiert</div>
          <ul className="space-y-1.5 text-xs text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
              <span>ATS-Integration (Personio, SAP SF, Workday)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
              <span>Slack &amp; Microsoft Teams Notifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
              <span>Zapier (mehrere tausend Apps)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
              <span>35 Referenzprüfungen / Monat, 15 Nutzer-Sitze</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
              <span>Dedicated Customer Success Manager</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <Link href="/preise" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4" />
            Zu den Plänen
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
