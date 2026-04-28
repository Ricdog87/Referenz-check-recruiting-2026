import Link from 'next/link'

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
                <span className="text-white text-xs font-black">RC</span>
              </div>
              <span className="font-bold text-text-primary">RefCheck</span>
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
              { label: 'ROI-Rechner', href: '#roi' },
            ]}
          />

          <FooterCol
            title="Für wen"
            links={[
              { label: 'HR-Abteilungen', href: '/preise#hr' },
              { label: 'Personaldienstleister', href: '/preise#agency' },
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
          <div>© 2026 RefCheck Solutions GmbH · Alle Rechte vorbehalten.</div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-text-primary transition-colors">Anmelden</Link>
            <Link href="/register" className="hover:text-text-primary transition-colors">Konto erstellen</Link>
            <a href="mailto:hello@refcheck.de" className="hover:text-text-primary transition-colors">hello@refcheck.de</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
