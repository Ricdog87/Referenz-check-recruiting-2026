import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Nav */}
      <nav className="border-b border-border bg-bg-primary/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">RC</span>
            </div>
            <span className="font-semibold text-text-primary">RefCheck</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary py-2 px-4">
              Anmelden
            </Link>
            <Link href="/register" className="btn-primary py-2 px-4">
              Kostenlos starten
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent-glow border border-accent/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-soft" />
            <span className="text-xs text-accent font-medium">DSGVO-konform · Hosted in Germany</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Referenzen prüfen.
            <br />
            <span className="text-accent">Sicher eingestellt.</span>
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-10 max-w-2xl mx-auto">
            KI generiert täglich hunderte passende Bewerbungen. Wir prüfen die Realität dahinter —
            Zeugnisse, Tätigkeiten, frühere Arbeitgeber. Damit Sie sich auf echte Kandidaten fokussieren.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="btn-primary py-3 px-8 text-base">
              Jetzt kostenlos testen
            </Link>
            <Link href="/login" className="btn-secondary py-3 px-8 text-base">
              Demo ansehen
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-6 mt-20 max-w-2xl mx-auto">
          {[
            { value: '94%', label: 'Verifizierungsquote' },
            { value: '<48h', label: 'Bearbeitungszeit' },
            { value: '100%', label: 'DSGVO-konform' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold font-mono text-accent mb-1">{s.value}</div>
              <div className="text-xs text-text-secondary">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="border-t border-border bg-bg-secondary">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs font-medium text-status-error uppercase tracking-widest mb-4">Das Problem</div>
              <h2 className="text-3xl font-bold mb-6">KI flutet Ihren Posteingang</h2>
              <ul className="space-y-4">
                {[
                  'Dutzende KI-optimierte Bewerbungen täglich',
                  'Kein Zeitbudget für manuelle Referenzprüfung',
                  'Zeugnisse sind einfach zu fälschen oder aufzubessern',
                  'Fehleinstellungen kosten Unternehmen 50.000–200.000 €',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-text-secondary text-sm">
                    <span className="text-status-error mt-0.5">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-medium text-status-success uppercase tracking-widest mb-4">Die Lösung</div>
              <h2 className="text-3xl font-bold mb-6">RefCheck übernimmt die Prüfung</h2>
              <ul className="space-y-4">
                {[
                  'Zeugnisse und Dokumente strukturiert erfassen',
                  'Frühere Arbeitgeber systematisch kontaktieren',
                  'Tätigkeiten und Zeiträume verifizieren',
                  'Klares Ergebnis: Verifiziert oder Unstimmigkeit gefunden',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-text-secondary text-sm">
                    <span className="text-status-success mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-4">Alles was Sie brauchen</h2>
          <p className="text-text-secondary">Eine Plattform. Vollständiger Überblick.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '⬆',
              title: 'CV Upload',
              desc: 'Bewerbungsunterlagen sicher hochladen und zentral verwalten. Unterstützt PDF, DOC und Bildformate.',
            },
            {
              icon: '📋',
              title: 'Referenzprüfung',
              desc: 'Strukturierte Prüfung bei früheren Arbeitgebern. Zeiträume, Positionen und Tätigkeiten verifizieren.',
            },
            {
              icon: '🛡',
              title: 'DSGVO-konform',
              desc: 'Einwilligungsmanagement, Datenlöschung und Export auf Knopfdruck. Datenspeicherung in Deutschland.',
            },
            {
              icon: '📊',
              title: 'Dashboard',
              desc: 'Echtzeit-Übersicht aller Kandidaten und Prüfungen. Nie wieder den Überblick verlieren.',
            },
            {
              icon: '🔔',
              title: 'Status-Tracking',
              desc: 'Von offen bis abgeschlossen — jede Prüfung hat einen klaren Status und Verlauf.',
            },
            {
              icon: '🔒',
              title: 'Sicher & verschlüsselt',
              desc: 'Alle Daten verschlüsselt übertragen und gespeichert. Server ausschließlich in Deutschland.',
            },
          ].map((f) => (
            <div key={f.title} className="card hover:border-border-strong transition-colors duration-200">
              <div className="text-2xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-text-primary mb-2">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DSGVO Section */}
      <section className="border-t border-b border-border bg-bg-secondary">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-shrink-0 w-16 h-16 bg-accent-glow border border-accent/30 rounded-2xl flex items-center justify-center text-2xl">
              🇩🇪
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3">DSGVO-Compliance by Design</h2>
              <p className="text-text-secondary text-sm leading-relaxed max-w-2xl">
                RefCheck wurde von Grund auf DSGVO-konform entwickelt. Alle Daten werden ausschließlich auf deutschen
                Servern gespeichert. Kandidaten-Einwilligungen werden dokumentiert. Auf Wunsch können alle
                personenbezogenen Daten vollständig exportiert oder gelöscht werden — in Übereinstimmung mit Art. 17
                und Art. 20 DSGVO.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-bold mb-4">Bereit, Bewerbungen wirklich zu prüfen?</h2>
        <p className="text-text-secondary mb-8">Starten Sie kostenlos. Keine Kreditkarte erforderlich.</p>
        <Link href="/register" className="btn-primary py-3 px-10 text-base">
          Jetzt starten
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">RC</span>
            </div>
            <span className="text-sm text-text-secondary">© 2026 RefCheck</span>
          </div>
          <div className="flex gap-6 text-sm text-text-secondary">
            <Link href="/datenschutz" className="hover:text-text-primary transition-colors">Datenschutz</Link>
            <Link href="/impressum" className="hover:text-text-primary transition-colors">Impressum</Link>
            <Link href="/agb" className="hover:text-text-primary transition-colors">AGB</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
