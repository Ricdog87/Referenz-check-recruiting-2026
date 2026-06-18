import Link from 'next/link'
import { ArrowRight, TrendingUp, ShieldCheck, Sparkles, BarChart3, type LucideIcon } from 'lucide-react'

type Page = {
  href: string
  label: string
  desc: string
  icon: LucideIcon
}

const PAGES: Page[] = [
  {
    href: '/roi-rechner',
    label: 'ROI-Rechner',
    desc: 'Was kostet Sie eine Fehlbesetzung — und was bringt candiq?',
    icon: TrendingUp,
  },
  {
    href: '/pilotprogramm',
    label: 'Pilot-Programm',
    desc: 'Frühzugang mit Konditionen, direkt mit dem Gründerteam.',
    icon: Sparkles,
  },
  {
    href: '/compliance',
    label: 'Compliance & DSGVO',
    desc: 'Sechs konkrete Garantien für Ihr Datenschutz-Team.',
    icon: ShieldCheck,
  },
  {
    href: '/preise',
    label: 'Preise & Pakete',
    desc: 'Transparente Pläne ab 65 €/Monat plus Add-on-Services.',
    icon: BarChart3,
  },
]

/**
 * Cross-Link-Strip zwischen den Detail-Seiten der Landing. Zeigt drei
 * andere als die aktuell besuchte Seite, sortiert nach Marketing-
 * Relevanz. SEO-Effekt: interne Link-Dichte erhoeht das Ranking-Signal
 * dieser Hub-Seiten, plus klassischer Conversion-Effekt (wer den ROI
 * berechnet hat, ist warm für Pilot- oder Preis-Klick).
 */
export function RelatedPagesStrip({ currentHref }: { currentHref: string }) {
  const others = PAGES.filter((p) => p.href !== currentHref).slice(0, 3)
  return (
    <section className="py-16 px-6 border-t border-border bg-bg-secondary">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
            Weiterführend
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
            Das schauen sich Käufer als nächstes an
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {others.map(({ href, label, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="card-md bg-white hover:border-brand-300 hover:shadow-card-lg transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-4 group-hover:bg-brand-100 transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-base font-semibold text-text-primary mb-1.5 leading-tight">
                {label}
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mb-3">{desc}</p>
              <div className="text-xs font-semibold text-brand-700 inline-flex items-center gap-1.5 group-hover:gap-2 transition-all">
                Ansehen <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
