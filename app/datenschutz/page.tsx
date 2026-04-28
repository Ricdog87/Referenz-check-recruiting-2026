import Link from 'next/link'

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <nav className="border-b border-border px-6 h-16 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">CQ</span>
          </div>
          <span className="font-semibold">candiq</span>
        </Link>
        <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">← Zurück</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <h1 className="text-3xl font-bold">Datenschutzerklärung</h1>

        <div className="text-sm text-text-secondary space-y-6 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">1. Verantwortlicher</h2>
            <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist das Unternehmen, das candiq betreibt (im Folgenden „wir" oder „uns").</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">2. Erhobene Daten</h2>
            <p>Wir verarbeiten folgende personenbezogene Daten:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Kontodaten: Name, Unternehmensname, E-Mail-Adresse (B2B-Kunden)</li>
              <li>Kandidatendaten: Name, E-Mail, Telefon, Bewerbungsunterlagen</li>
              <li>Prüfungsdaten: Arbeitgeberkontakte, Prüfungsnotizen, Ergebnisse</li>
              <li>Technische Daten: IP-Adresse (für Einwilligungsnachweise), Log-Daten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">3. Rechtsgrundlagen</h2>
            <p>Die Verarbeitung erfolgt auf Grundlage von:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</li>
              <li>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</li>
              <li>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">4. Datenspeicherung</h2>
            <p>Alle Daten werden ausschließlich auf Servern in Deutschland (Hostinger DE) gespeichert. Es findet keine Übermittlung an Drittländer statt.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">5. Ihre Rechte</h2>
            <p>Sie haben folgende Rechte gemäß DSGVO:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Auskunftsrecht (Art. 15)</li>
              <li>Berichtigungsrecht (Art. 16)</li>
              <li>Löschungsrecht (Art. 17) — im Dashboard unter Einstellungen</li>
              <li>Datenportabilität (Art. 20) — JSON-Export im Dashboard</li>
              <li>Widerspruchsrecht (Art. 21)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">6. Cookies</h2>
            <p>Wir verwenden ausschließlich einen Session-Cookie für die Anmeldung. Es werden keine Tracking- oder Marketing-Cookies eingesetzt.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">7. Aufbewahrungsfristen</h2>
            <p>Personenbezogene Daten werden gelöscht, sobald sie für den Verarbeitungszweck nicht mehr erforderlich sind, spätestens jedoch nach Beendigung des Vertragsverhältnisses.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
