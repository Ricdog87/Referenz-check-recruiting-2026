import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    price: '79 €',
    period: '/ Monat',
    included: '3 Prüfungen inklusive',
    extra: '49 € pro Zusatzprüfung',
    highlight: false,
    features: [
      '1 Team',
      'Dashboard & Status-Tracking',
      'DSGVO-konformer Prüfprozess',
      'E-Mail-Support',
    ],
  },
  {
    name: 'Professional',
    price: '249 €',
    period: '/ Monat',
    included: '10 Prüfungen inklusive',
    extra: '35 € pro Zusatzprüfung',
    highlight: true,
    features: [
      'Bis zu 5 Teammitglieder',
      'Priorisierte Bearbeitung',
      'Rollen & Berechtigungen',
      'Exportierbare Ergebnisberichte',
    ],
  },
  {
    name: 'Business',
    price: '649 €',
    period: '/ Monat',
    included: '30 Prüfungen inklusive',
    extra: '25 € pro Zusatzprüfung',
    highlight: false,
    features: [
      'Bis zu 20 Teammitglieder',
      'Mehrere Standorte/Units',
      'Audit-Log & Governance-Setup',
      'SLA-orientierter Support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Individuell',
    period: '',
    included: 'Individuelles Volumenmodell',
    extra: 'Custom Onboarding & Vertragsmodell',
    highlight: false,
    features: [
      'Unbegrenzte Teams',
      'Erweiterte Compliance-Anforderungen',
      'Individuelle Integrationsoptionen',
      'Dedizierter Ansprechpartner',
    ],
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <Link href="/" className="text-sm text-white/55 hover:text-white transition-colors">
            ← Zur Startseite
          </Link>
        </div>

        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-4">Preise</p>
          <h1 className="text-[clamp(34px,6vw,62px)] font-bold tracking-tightest gradient-text-white mb-5">
            Preisstruktur für verlässliche Hiring-Entscheidungen
          </h1>
          <p className="text-white/45 max-w-3xl mx-auto leading-relaxed">
            Für HR-Abteilungen, Inhouse-Recruiting, Personaldienstleister und Executive Search im DACH-Raum.
            Alle Pakete enthalten den plattformgestützten, dokumentierten Prüfprozess inklusive standardisierter
            telefonischer Verifikation.
          </p>
          <p className="text-xs text-white/45 mt-5">Keine Kreditkarte · 14 Tage Test · DSGVO-konform · Server in Deutschland · Schneller Go-live</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-4 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border ${
                plan.highlight ? 'border-accent/40 bg-accent/10' : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <h2 className="text-lg font-semibold text-white/90 mb-4">{plan.name}</h2>
              <div className="mb-4">
                <div className="text-3xl font-bold tracking-tight text-white">{plan.price}</div>
                <div className="text-xs text-white/45">{plan.period}</div>
              </div>
              <p className="text-sm text-white/80 mb-1">{plan.included}</p>
              <p className="text-xs text-white/45 mb-6">{plan.extra}</p>

              <ul className="space-y-2 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="text-xs text-white/60">
                    • {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === 'Enterprise' ? '/login' : '/register'}
                className={`w-full inline-flex justify-center rounded-full py-2.5 px-4 text-sm font-semibold transition-all ${
                  plan.highlight
                    ? 'bg-accent text-white hover:bg-accent-hover'
                    : 'border border-white/15 text-white/80 hover:text-white hover:border-white/30'
                }`}
              >
                {plan.name === 'Enterprise' ? 'Kontakt aufnehmen' : '14 Tage testen'}
              </Link>
            </div>
          ))}
        </div>

        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight gradient-text-white">Einwände schnell geklärt</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                q: 'Wie schnell ist Go-live?',
                a: 'Typischerweise innerhalb eines Arbeitstags: Team anlegen, Rollen vergeben, ersten Prüfauftrag starten.',
              },
              {
                q: 'Wie läuft die Einwilligung?',
                a: 'Einwilligungen werden vor Prüfstart erfasst und im Workflow revisionssicher dokumentiert.',
              },
              {
                q: 'Ist das für Personaldienstleister geeignet?',
                a: 'Ja, die Plattform ist für Inhouse-Recruiting, Agenturmodelle und Executive Search ausgelegt.',
              },
              {
                q: 'Wie werden Zusatzprüfungen abgerechnet?',
                a: 'Monatlich auf Basis des gewählten Pakets und der tatsächlichen Zusatzprüfungen zum fixen Stückpreis.',
              },
            ].map((item) => (
              <div key={item.q} className="card-glass p-5 rounded-2xl">
                <h3 className="text-sm font-semibold text-white/90 mb-2">{item.q}</h3>
                <p className="text-sm text-white/45">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center pb-8">
          <h2 className="text-[clamp(30px,5vw,48px)] font-bold tracking-tightest gradient-text-white mb-4">
            Starten Sie mit einem klaren, skalierbaren Prüfprozess
          </h2>
          <p className="text-white/45 mb-8">14 Tage kostenlos testen, ohne Kreditkarte und ohne Implementierungsprojekt.</p>
          <Link href="/register" className="btn-primary text-base py-3.5 px-8 rounded-full font-semibold">
            Jetzt kostenlos starten
          </Link>
        </section>
      </div>
    </div>
  )
}
