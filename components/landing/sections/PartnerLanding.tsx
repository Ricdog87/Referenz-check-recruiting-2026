import Link from 'next/link'
import {
  ArrowRight,
  ShieldCheck,
  Handshake,
  TrendingUp,
  Layers,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react'

/**
 * Partner-Landing — öffentliche Marketing-Page für PDL-Reseller.
 *
 * GUARDRAILS (Phase 2):
 *   - KEINE EK-Preise, KEINE Discount-Prozentsätze im HTML/Bundle.
 *     Diese Datei darf nichts aus lib/utils.ts (HR_PLANS/AGENCY_PLANS)
 *     importieren und keine Prisma-Reads machen.
 *   - Tier-Tabelle zeigt nur Schwellenwerte (aktive Kunden) + qualitative
 *     Positionierung — keine numerischen Margen.
 *   - Pflicht-Hinweis "verifiziert durch candiq" ist hier schon im Visual
 *     Hero verankert; im Dashboard (Phase 4) wird das Siegel pflicht-mountet.
 *
 * Komponente ist Server-Component (kein 'use client'). Accordion via
 * <details>/<summary> — keine JS-Bundle-Kosten, voll accessible.
 */

const STEPS = [
  {
    n: '01',
    title: 'Bewerben & verifiziert werden',
    body:
      'Über /partner/register stellen Sie Ihre Personaldienstleistung kurz vor. Wir prüfen in 2 Werktagen Sitz, Branche und Referenzen — nur seriöse Häuser bekommen Zugriff. Kein Massenmarkt.',
  },
  {
    n: '02',
    title: 'Co-Brand einrichten',
    body:
      'Logo hochladen, Domain wahlen, Reports white-labeln. Das candiq-Siegel „verifiziert durch candiq" bleibt sichtbarer Pflichtbestandteil — das ist die Vertrauensschicht, die Ihre Kunden kaufen.',
  },
  {
    n: '03',
    title: 'Mandanten anlegen, Marge frei wählen',
    body:
      'Im Dashboard sehen Sie Ihren Einkauf, setzen Ihren Verkaufspreis und sehen die Marge live. Sie behalten die Kundenbeziehung, candiq bleibt im Hintergrund.',
  },
  {
    n: '04',
    title: 'Mit aktiven Kunden aufsteigen',
    body:
      'Mehr aktive Mandanten heißt bessere EK-Konditionen — automatisch, transparent. Vier Stufen, klare Schwellen, kein verstecktes Kleingedrucktes.',
  },
]

const TIERS = [
  {
    name: 'Registered',
    threshold: 'ab dem 1. aktiven Kunden',
    position: 'Einstieg',
    perks: [
      'Voller Zugriff aufs Reseller-Dashboard',
      'White-Label-Reports mit Ihrem Logo',
      'Co-Brand-Welcome-Mail an Endkunden',
    ],
  },
  {
    name: 'Silver',
    threshold: 'ab 5 aktiven Kunden',
    position: 'Wachstum',
    perks: [
      'Bessere EK-Konditionen',
      'Quartalsweise Strategie-Calls',
      'Priorisierter Reviewer-Pool für Ihre Mandanten',
    ],
  },
  {
    name: 'Gold',
    threshold: 'ab 15 aktiven Kunden',
    position: 'Premium',
    badge: 'Beliebt',
    perks: [
      'Spürbar bessere EK-Konditionen',
      'Eigener Customer Success Manager',
      'Quartalsweise Markt-Briefings & PDL-Benchmark',
      'Express-24h-Reviews ohne Aufpreis',
    ],
  },
  {
    name: 'Platinum',
    threshold: 'ab 30 aktiven Kunden',
    position: 'Top-Konditionen',
    perks: [
      'Beste EK-Konditionen im Programm',
      'Quartalsweise Founder-Call',
      'Mit-Mitwirkung an Roadmap & Beta-Zugriff',
      'Joint-Marketing & Case-Study-Slots',
    ],
  },
]

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Was kostet der Einkauf? Warum sehe ich keine Zahlen?',
    a: (
      <>
        EK-Konditionen besprechen wir nach Bewerbung im persönlichen
        Gespräch. Hintergrund: jede Tier-Stufe bekommt einen festen
        Discount auf den jeweils aktuellen Listenpreis. Wir nennen das
        bewusst nicht öffentlich, damit Ihre Endkunden nicht den
        Margen-Aufschlag rückrechnen können. Nach der Registrierung
        sehen Sie alle Werte im Dashboard — transparent, jederzeit.
      </>
    ),
  },
  {
    q: 'Wer hat die Kundenbeziehung?',
    a: (
      <>
        Sie. Der Endkunde unterschreibt mit Ihnen, zahlt an Sie, kennt
        Sie als Anbieter. candiq erscheint ausschließlich als
        „verifizierende Instanz" auf dem Report — das ist die
        Vertrauensschicht, kein konkurrierendes Branding.
      </>
    ),
  },
  {
    q: 'Was zählt als „aktiver Kunde"?',
    a: (
      <>
        Ein Mandant, den Sie im Dashboard mit Status <code>ACTIVE</code>{' '}
        führen. Pausierte oder gekündigte Mandanten fallen aus der
        Tier-Zählung raus. Wir rechnen einmal pro Monat — wer eine
        Tier-Schwelle reißt, bekommt automatisch die neue Stufe samt
        besseren Konditionen für den nächsten Abrechnungszyklus.
      </>
    ),
  },
  {
    q: 'Bekomme ich Zugriff auf Daten der Endkunden?',
    a: (
      <>
        Nein — und das ist Absicht. Sie sehen Ihre Mandantenliste,
        deren Pläne und Ihre eigene Marge. Sie sehen <strong>nicht</strong>{' '}
        die Bewerberdaten, Reference-Calls oder Consent-Tokens dieser
        Mandanten — das gehört dem Endkunden und der jeweiligen
        Bewerber:in. So sind wir DSGVO-sauber und Sie haften nicht für
        Datenverarbeitung, die Sie gar nicht steuern können.
      </>
    ),
  },
  {
    q: 'Kann ich das candiq-Siegel entfernen?',
    a: (
      <>
        Nein. Das Siegel „verifiziert durch candiq" ist nicht entfernbar
        — es ist genau das Asset, das Ihre Kunden bei Ihnen kaufen
        wollen. Wer ein vollständiges Pure-Whitelabel ohne candiq-Bezug
        sucht, ist im Partner-Programm falsch.
      </>
    ),
  },
  {
    q: 'Mindestumsatz oder Mindestlaufzeit?',
    a: (
      <>
        Beides: nein. Sie zahlen pro Mandant, den Sie aktiv führen.
        Kündigen ist im Dashboard ein Klick. Wer keinen aktiven Mandanten
        hat, zahlt nichts und behält den Account.
      </>
    ),
  },
  {
    q: 'Welche Branchen sind ausgeschlossen?',
    a: (
      <>
        Keine Vermittlung in Rotlicht-, Glücksspiel- oder politische
        Kampagnen-Kontexte. Sonst sind wir branchenoffen — IT, Pflege,
        Gewerblich-Technisch, Office, Engineering, Healthcare.
      </>
    ),
  },
]

export function PartnerLanding() {
  return (
    <>
      {/* Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-5">
            <Handshake className="w-3.5 h-3.5" /> Partner-Programm für Personaldienstleister
          </div>
          <h1 className="text-[clamp(34px,5vw,56px)] font-bold leading-[1.05] tracking-tightest text-text-primary mb-5">
            Verkaufen Sie unter Ihrer Marke.{' '}
            <span className="text-gradient-brand">candiq macht die Tiefe.</span>
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Personaldienstleister, die Referenzprüfung als eigenen Service
            anbieten wollen — ohne ein eigenes Reviewer-Team aufzubauen.
            Sie behalten den Kunden, Ihre Marge und Ihre Konditionen.
            Wir liefern die verifizierte Substanz unter Co-Brand.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/partner/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-text-primary text-white font-semibold hover:bg-indigo-700 transition-colors"
            >
              Jetzt bewerben
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#tiers"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border-default text-text-primary font-semibold hover:bg-surface-subtle transition-colors"
            >
              Stufen ansehen
            </a>
          </div>
          <p className="mt-5 text-xs text-text-muted">
            Prüfung der Bewerbung in 2 Werktagen · Kein Mindestumsatz · Monatlich kündbar
          </p>
        </div>
      </section>

      {/* Trust-Strip: das Co-Brand-Versprechen ───────────────────────── */}
      <section className="pb-16 px-6">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: ShieldCheck,
              k: 'Ihr Logo, candiq-Siegel',
              v: 'Reports tragen Ihre Marke; das Siegel „verifiziert durch candiq" bleibt sichtbar — genau das Asset, das Ihre Kunden kaufen.',
            },
            {
              icon: TrendingUp,
              k: 'Marge frei wählbar',
              v: 'Sie sehen Ihren EK im Dashboard, setzen Ihren Verkaufspreis pro Mandant. candiq mischt sich nicht ein.',
            },
            {
              icon: Lock,
              k: 'DSGVO-saubere Grenze',
              v: 'Sie sehen Ihre Mandantenliste und Marge — nicht aber Bewerberdaten Ihrer Endkunden. Sie haften nur für das, was Sie steuern.',
            },
          ].map(({ icon: Icon, k, v }) => (
            <div key={k} className="card-md">
              <Icon className="w-5 h-5 text-indigo-600 mb-3" />
              <div className="text-sm font-semibold text-text-primary leading-snug">{k}</div>
              <div className="text-xs text-text-muted mt-2 leading-relaxed">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* So funktioniert es ──────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-surface-subtle/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white text-text-secondary border border-border-default mb-4">
              <Layers className="w-3.5 h-3.5" /> Vom Antrag zur ersten Marge
            </div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-tightest text-text-primary">
              Vier Schritte, klare Schnittstelle.
            </h2>
          </div>
          <ol className="grid md:grid-cols-2 gap-5">
            {STEPS.map((s) => (
              <li key={s.n} className="card-md">
                <div className="text-xs font-mono text-indigo-600 mb-2">{s.n}</div>
                <div className="text-base font-semibold text-text-primary mb-2 leading-snug">
                  {s.title}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Tier-Ladder — OHNE Discount-Prozente! ───────────────────────── */}
      <section id="tiers" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Vier Tier-Stufen
            </div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-tightest text-text-primary mb-3">
              Mehr aktive Mandanten, bessere Konditionen.
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Automatischer Aufstieg, kein Verhandeln. Konkrete EK-Werte
              und Margen sehen Sie nach der Registrierung in Ihrem
              Dashboard — bewusst nicht öffentlich, damit Ihre Endkunden
              den Aufschlag nicht rückrechnen können.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className={
                  'card-md flex flex-col ' +
                  (t.badge
                    ? 'ring-2 ring-indigo-500 relative'
                    : 'border border-border-default')
                }
              >
                {t.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold tracking-wide uppercase">
                    {t.badge}
                  </span>
                )}
                <div className="text-xs uppercase tracking-wide text-text-muted mb-1">
                  {t.position}
                </div>
                <div className="text-xl font-bold text-text-primary mb-1">{t.name}</div>
                <div className="text-xs text-text-secondary mb-5">{t.threshold}</div>
                <ul className="space-y-2 text-sm text-text-secondary mt-auto">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="leading-snug">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-text-muted mt-8">
            „Aktiv" = Mandant mit Status <code>ACTIVE</code> im Dashboard.
            Tier-Berechnung läuft monatlich, neue Stufe wirkt im nächsten
            Abrechnungszyklus.
          </p>
        </div>
      </section>

      {/* FAQ — Accordion via native <details>, kein JS-Bundle ────────── */}
      <section className="py-20 px-6 bg-surface-subtle/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-tightest text-text-primary mb-3">
              Häufige Fragen
            </h2>
            <p className="text-text-secondary">
              Was nicht im FAQ steht, klären wir im Erstgespräch nach
              Ihrer Bewerbung.
            </p>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <details
                key={i}
                className="group card-md cursor-pointer open:ring-1 open:ring-indigo-200"
              >
                <summary className="flex items-center justify-between gap-4 text-sm font-semibold text-text-primary list-none [&::-webkit-details-marker]:hidden">
                  <span className="leading-snug">{f.q}</span>
                  <span className="text-indigo-600 group-open:rotate-45 transition-transform text-xl leading-none select-none">
                    +
                  </span>
                </summary>
                <div className="pt-3 mt-3 border-t border-border-default text-sm text-text-secondary leading-relaxed">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-tightest text-text-primary mb-4">
            Bereit, candiq unter Ihrer Marke anzubieten?
          </h2>
          <p className="text-text-secondary mb-8 leading-relaxed">
            Kurze Bewerbung, 2 Werktage Prüfung, dann Erstgespräch zu
            EK-Konditionen und Co-Brand-Setup. Kein Vertrag, der Sie
            länger als einen Monat bindet.
          </p>
          <Link
            href="/partner/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-text-primary text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Bewerbung starten
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-5 text-xs text-text-muted">
            Fragen vorab? <a href="mailto:partner@candiq.de" className="underline hover:text-indigo-600">partner@candiq.de</a>
          </p>
        </div>
      </section>
    </>
  )
}
