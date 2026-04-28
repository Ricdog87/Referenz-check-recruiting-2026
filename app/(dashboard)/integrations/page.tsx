import { Header } from '@/components/layout/Header'
import { Plug, ArrowRight, Mail } from 'lucide-react'

const ATS = [
  { name: 'Personio', cat: 'ATS / HRIS', desc: 'Kandidaten-Sync mit Personio. Ein-Klick-Import von Bewerberprofilen.', status: 'live' },
  { name: 'SAP SuccessFactors', cat: 'HRIS', desc: 'Enterprise-Integration für globale HR-Teams. Kandidatendaten, Stellenangebote.', status: 'beta' },
  { name: 'Workday', cat: 'HRIS', desc: 'Konzern-tauglich. Einsehbar im Workday Marketplace.', status: 'soon' },
  { name: 'Greenhouse', cat: 'ATS', desc: 'Webhook + REST API. Automatisches Triggering von Reference-Checks.', status: 'live' },
  { name: 'Workable', cat: 'ATS', desc: 'Direkter Job-Sync und Kandidaten-Status-Updates.', status: 'live' },
  { name: 'Recruitee', cat: 'ATS', desc: 'Beliebt im DACH-Mittelstand. Bidirektionaler Sync.', status: 'beta' },
]

const COLLAB = [
  { name: 'Slack', cat: 'Notifications', desc: 'Echtzeit-Updates bei Status-Änderungen, Diskrepanzen, Abschluss.', status: 'live' },
  { name: 'Microsoft Teams', cat: 'Notifications', desc: 'Adaptive Cards für Hiring Manager, ohne Tool-Wechsel.', status: 'live' },
  { name: 'Zapier', cat: 'No-Code', desc: 'Mehrere tausend Apps via Zapier-Trigger.', status: 'live' },
]

const STATUS = {
  live: { label: 'Live', class: 'badge-success' },
  beta: { label: 'Beta', class: 'badge-warning' },
  soon: { label: 'Demnächst', class: 'badge bg-slate-100 text-slate-600 border border-slate-200' },
} as const

export default function IntegrationsPage() {
  return (
    <>
      <Header title="Integrationen" subtitle="Verbinden Sie RefCheck mit Ihrem Tech-Stack" />
      <div className="space-y-8">
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
          <a href="mailto:integrations@refcheck.de" className="btn-secondary text-xs">
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
        {items.map((it) => {
          const s = STATUS[it.status as keyof typeof STATUS]
          return (
            <div key={it.name} className="card-md group hover:shadow-card-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-bg-secondary border border-border flex items-center justify-center text-text-secondary font-bold">
                  {it.name[0]}
                </div>
                <span className={`${s.class} text-[10px]`}>{s.label}</span>
              </div>
              <div className="font-semibold text-text-primary mb-1">{it.name}</div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">{it.cat}</div>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">{it.desc}</p>
              <button disabled={it.status !== 'live'}
                className={`w-full text-xs font-semibold py-2 rounded-full transition-all ${
                  it.status === 'live'
                    ? 'bg-bg-secondary border border-border hover:border-border-strong text-text-primary'
                    : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
                }`}>
                {it.status === 'live' ? <>Verbinden <ArrowRight className="w-3 h-3 inline ml-1" /></> : 'Demnächst'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
