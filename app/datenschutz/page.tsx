import { LegalShell } from '@/components/landing/LegalShell'

export const metadata = {
  title: 'Datenschutzerklärung — candiq',
  description: 'Wie wir personenbezogene Daten gemäß DSGVO verarbeiten.',
}

export default function DatenschutzPage() {
  return (
    <LegalShell
      title="Datenschutzerklärung"
      subtitle="Wie wir Ihre Daten gemäß DSGVO schützen und verarbeiten"
    >
      <p className="lead text-text-secondary">
        Wir nehmen den Schutz Ihrer personenbezogenen Daten sehr ernst. Diese Datenschutzerklärung informiert
        Sie über Art, Umfang und Zweck der Verarbeitung Ihrer Daten gemäß DSGVO.
      </p>

      <h2>1. Verantwortlicher</h2>
      <p>
        Verantwortlich im Sinne von Art. 4 Abs. 7 DSGVO ist die <strong>RSG Recruiting Solutions group GmbH</strong>,
        vertreten durch die Geschäftsführung. Alle Kontaktdaten finden Sie im{' '}
        <a href="/impressum">Impressum</a>.
      </p>

      <h2>2. Welche Daten verarbeiten wir?</h2>
      <ul>
        <li><strong>Kontodaten:</strong> Name, Unternehmen, geschäftliche E-Mail-Adresse, Passwort-Hash</li>
        <li><strong>Kandidatendaten:</strong> Vor- und Nachname, Kontaktdaten, Bewerbungsunterlagen, Zeugnisse</li>
        <li><strong>Prüfungsdaten:</strong> Arbeitgeberkontakte, Gesprächsnotizen, Verifizierungsergebnisse</li>
        <li><strong>Technische Daten:</strong> IP-Adresse (zur Einwilligungsdokumentation), User-Agent, Audit-Logs</li>
      </ul>

      <h2>3. Rechtsgrundlagen</h2>
      <ul>
        <li><strong>Art. 6 Abs. 1 lit. b DSGVO</strong> — Vertragserfüllung (Bereitstellung der candiq-Plattform)</li>
        <li><strong>Art. 6 Abs. 1 lit. a DSGVO</strong> — Einwilligung (Kandidaten-Einwilligung zur Referenzprüfung)</li>
        <li><strong>Art. 6 Abs. 1 lit. f DSGVO</strong> — Berechtigtes Interesse (Plattform-Sicherheit, Audit-Trail)</li>
      </ul>

      <h2>4. Auftragsverarbeitung (AVV) <span id="avv" /></h2>
      <p>
        Sofern Sie als Kunde personenbezogene Daten Ihrer Kandidaten in unserer Plattform verarbeiten,
        bieten wir einen Vertrag zur Auftragsverarbeitung gemäß Art. 28 DSGVO an. Diesen erhalten Sie
        automatisch im Onboarding-Prozess.
      </p>

      <h2>5. Datenspeicherung & Hosting</h2>
      <p>
        Alle personenbezogenen Daten werden ausschließlich auf Servern in der Bundesrepublik Deutschland
        gespeichert (Hetzner / Strato Rechenzentren mit ISO 27001-Zertifizierung). Es findet keine
        Übermittlung in Drittländer statt.
      </p>

      <h2>6. Verschlüsselung</h2>
      <p>
        Datenübertragung erfolgt ausschließlich verschlüsselt (TLS 1.3). Passwörter werden mittels bcrypt
        gehasht; Dokumente werden im Vercel Blob Storage AES-256-verschlüsselt abgelegt.
      </p>

      <h2>7. Ihre Rechte</h2>
      <ul>
        <li><strong>Art. 15 DSGVO</strong> — Auskunftsrecht</li>
        <li><strong>Art. 16 DSGVO</strong> — Berichtigung</li>
        <li><strong>Art. 17 DSGVO</strong> — Löschung (im Dashboard unter Einstellungen)</li>
        <li><strong>Art. 20 DSGVO</strong> — Datenportabilität (JSON-Export im Dashboard)</li>
        <li><strong>Art. 21 DSGVO</strong> — Widerspruchsrecht</li>
        <li><strong>Art. 77 DSGVO</strong> — Beschwerderecht bei der Aufsichtsbehörde</li>
      </ul>

      <h2>8. Cookies</h2>
      <p>
        Wir verwenden ausschließlich technisch notwendige Cookies (Session-Cookie für Authentifizierung).
        Es findet kein Tracking, keine Marketing-Pixel und keine Analyse-Cookies statt.
      </p>

      <h2>9. Aufbewahrungsfristen</h2>
      <p>
        Personenbezogene Daten werden gelöscht, sobald sie für den Verarbeitungszweck nicht mehr
        erforderlich sind. Audit-Logs werden für 24 Monate aufbewahrt (Art. 32 DSGVO Sicherheits-Anforderung).
      </p>

      <h2>10. Stand</h2>
      <p>Diese Datenschutzerklärung wurde zuletzt aktualisiert: April 2026.</p>
    </LegalShell>
  )
}
