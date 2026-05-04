import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-bg-secondary px-6 py-14">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-10 mb-12">
          {/* Brand col */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)', boxShadow: '0 4px 14px rgba(79,70,229,0.35)' }}>
                <span className="text-white text-xs font-black">CQ</span>
              </div>
              <span className="font-bold text-text-primary">candiq</span>
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm mb-5">
              DSGVO-konforme Referenzprüfung für moderne HR-Teams und Personaldienstleister im DACH-Raum.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-3.5 py-2 rounded-full bg-gradient-to-r from-brand-500 to-violet shadow-card hover:shadow-glow transition-shadow mb-4"
            >
              <Sparkles className="w-3 h-3" /> Live-Demo starten
            </Link>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>🇩🇪 Made in Germany</span>
            </div>
          </div>

          <FooterCol
            title="Produkt"
            links={[
              { label: 'So funktioniert\'s', href: '/#wie-es-funktioniert' },
              { label: 'Features', href: '/#features' },
              { label: 'Preise', href: '/preise' },
              { label: 'ROI-Rechner', href: '/#roi' },
              { label: 'Live-Demo', href: '/demo' },
            ]}
          />

          <FooterCol
            title="Für wen"
            links={[
              { label: 'HR-Abteilungen', href: '/preise#hr' },
              { label: 'Enterprise', href: '/preise#enterprise' },
              { label: 'Personaldienstleister · Beta', href: '/waitlist-agency', accent: true },
            ]}
          />

          <FooterCol
            title="Konto & Recht"
            links={[
              { label: 'Anmelden', href: '/login' },
              { label: 'Konto erstellen', href: '/register' },
              { label: 'Passwort vergessen', href: '/forgot-password' },
              { label: 'Datenschutz', href: '/datenschutz' },
              { label: 'AGB', href: '/agb' },
              { label: 'Impressum', href: '/impressum' },
            ]}
          />
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <div>© 2026 RSG Recruiting Solutions group GmbH · Alle Rechte vorbehalten.</div>
          <div className="hidden md:block text-[11px] text-text-muted">
            PDL-Pakete in Closed Beta · <Link href="/waitlist-agency" className="text-violet font-semibold hover:underline">Für frühen Zugang vormerken</Link>
          </div>
          <div className="flex items-center gap-4">
            <a href="mailto:hello@candiq.de" className="hover:text-text-primary transition-colors">hello@candiq.de</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: {
  title: string
  links: { label: string; href: string; accent?: boolean }[]
}) {
  return (
    <div>
      <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className={`text-sm transition-colors ${
                l.accent
                  ? 'text-violet font-semibold hover:text-violet/80'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
