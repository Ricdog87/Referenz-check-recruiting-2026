import Link from 'next/link'
import { BOOKING_URL } from '@/lib/site'

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-bg-secondary px-6 py-14">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-10 mb-12">
          {/* Brand col */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center mb-5" aria-label="candiq Startseite">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="candiq"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm mb-5">
              DSGVO-konforme Referenzprüfung für moderne HR-Teams und Personaldienstleister im DACH-Raum.
            </p>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>🇩🇪 Made in Germany</span>
            </div>
          </div>

          <FooterCol
            title="Produkt"
            links={[
              { label: 'Features', href: '#features' },
              { label: 'So funktioniert\'s', href: '#wie-es-funktioniert' },
              { label: 'Preise', href: '/preise' },
              { label: 'Live-Demo', href: '/demo' },
              { label: 'Termin buchen', href: BOOKING_URL, external: true },
            ]}
          />

          <FooterCol
            title="Für wen"
            links={[
              { label: 'HR-Abteilungen', href: '/preise#hr' },
              { label: 'Personaldienstleister (bald verfügbar)', href: '/waitlist-agency' },
              { label: 'Enterprise', href: '/preise#enterprise' },
            ]}
          />

          <FooterCol
            title="Rechtliches"
            links={[
              { label: 'Datenschutz', href: '/datenschutz' },
              { label: 'AGB', href: '/agb' },
              { label: 'Impressum', href: '/impressum' },
              { label: 'AVV (Auftragsverarbeitung)', href: '/datenschutz#avv' },
            ]}
          />
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <div>© 2026 RSG Recruiting Solutions group GmbH · Alle Rechte vorbehalten.</div>
          <div className="hidden md:block text-[11px] text-text-muted">
            PDL-Pakete befinden sich in Vorbereitung. Jetzt für frühen Zugang vormerken.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-text-primary transition-colors">Anmelden</Link>
            <Link href="/register" className="hover:text-text-primary transition-colors">Konto erstellen</Link>
            <a href="mailto:hello@candiq.de" className="hover:text-text-primary transition-colors">hello@candiq.de</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string; external?: boolean }[]
}) {
  return (
    <div>
      <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
