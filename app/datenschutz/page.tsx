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
        Personenbezogene Daten werden in Rechenzentren innerhalb der Europäischen Union, vorrangig in
        Deutschland, verarbeitet. Eine Übermittlung in Drittländer findet nicht statt; Ausnahme sind die
        unter „Reichweitenanalyse&ldquo; genannten Vercel-Dienste, die auf Basis der EU-Standardvertragsklauseln
        eingebunden sind.
      </p>

      <h2>6. Verschlüsselung</h2>
      <p>
        Die Datenübertragung zwischen Ihrem Endgerät und unseren Servern erfolgt ausschließlich
        verschlüsselt (HTTPS). Passwörter werden ausschließlich als gehashter Wert gespeichert, nicht im
        Klartext. Hochgeladene Dokumente werden verschlüsselt abgelegt und sind nur für autorisierte
        Nutzer Ihres Workspaces zugänglich.
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

      <h2>8. Zahlungsabwicklung über Stripe</h2>
      <p>
        Für die Abwicklung von Zahlungen und Abonnementsverwaltung nutzen wir den Zahlungs­dienstleister
        Stripe Payments Europe, Limited, 1 Grand Canal Street Lower, Grand Canal Dock, Dublin,
        D02 H210, Irland (im Folgenden „Stripe&ldquo;). Stripe verarbeitet im Auftrag personenbezogene
        Daten (Name, Anschrift, E-Mail-Adresse, USt-IdNr., Zahlungsdaten) zur Durchführung des
        Vertragsverhältnisses.
      </p>
      <p>
        Rechtsgrundlage der Verarbeitung ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
        Zahlungsdaten (z. B. Kreditkartennummer, SEPA-Mandat) werden ausschließlich an Stripe
        übermittelt; wir selbst speichern keine vollständigen Zahlungsmitteldaten.
      </p>
      <p>
        Stripe ist ein europäisches Tochterunternehmen der Stripe, Inc. (USA). Soweit personen­bezogene
        Daten im Rahmen der Zahlungsabwicklung an Stripe Inc. in die USA übermittelt werden,
        erfolgt dies auf Grundlage der EU-Standardvertragsklauseln (Standard Contractual Clauses, SCC)
        gemäß Art. 46 Abs. 2 lit. c DSGVO. Stripe Inc. ist außerdem unter dem EU-U.S. Data Privacy
        Framework zertifiziert.
      </p>
      <p>
        Die Auftragsverarbeitung erfolgt auf Basis eines Auftrags­verarbeitungs­vertrags (DPA) nach
        Art. 28 DSGVO, abrufbar unter <a href="https://stripe.com/legal/dpa" target="_blank" rel="noopener noreferrer">stripe.com/legal/dpa</a>.
        Datenschutz­erklärung von Stripe: <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer">stripe.com/de/privacy</a>.
      </p>
      <p>
        <strong>Speicherdauer:</strong> Solange das Vertragsverhältnis besteht und gesetzliche
        Aufbewahrungs­pflichten (insbesondere § 257 HGB, § 147 AO — 10 Jahre für Rechnungen)
        bestehen.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Wir verwenden ausschließlich technisch notwendige Cookies (Session-Cookie für Authentifizierung).
        Für die Reichweitenanalyse setzen wir Vercel Web Analytics ein — cookielos und auf Basis
        von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer datenschutzfreundlichen
        Reichweitenanalyse). Es werden keine Marketing-Pixel und keine Tracking-Cookies Dritter gesetzt.
      </p>

      <h2>10. Reichweitenanalyse (Vercel Web Analytics &amp; Speed Insights)</h2>
      <p>
        Wir nutzen Vercel Web Analytics und Vercel Speed Insights zur Messung der
        Reichweite und Performance unserer Website. Es werden keine Cookies gesetzt
        und keine personenbezogenen Daten dauerhaft gespeichert. IP-Adressen werden
        vor der Verarbeitung pseudonymisiert (gehasht). Rechtsgrundlage ist Art. 6
        Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer datenschutzfreundlichen
        Reichweitenanalyse). Anbieter: Vercel Inc., 340 S Lemon Ave #4133, Walnut,
        CA 91789, USA. Verarbeitung gemäß Standardvertragsklauseln.
      </p>

      <h2>11. Aufbewahrungsfristen</h2>
      <p>
        Personenbezogene Daten werden gelöscht, sobald sie für den Verarbeitungszweck nicht mehr
        erforderlich sind. Audit-Logs werden für 24 Monate aufbewahrt (Art. 32 DSGVO Sicherheits-Anforderung).
      </p>
      <p>
        <strong>Automatische Löschung nach 180 Tagen:</strong> Bewerber- und Referenzprüfungs-Daten,
        deren Verfahren abgeschlossen, abgelehnt oder vom Bewerber widerrufen wurde, werden
        spätestens 180 Tage nach Verfahrensende automatisch gelöscht. Die Löschung läuft als
        täglicher Cron-Job um <strong>03:00 UTC</strong> und wird im Audit-Log protokolliert.
      </p>

      <h2>12. Stand</h2>
      <p>Diese Datenschutzerklärung wurde zuletzt aktualisiert: Mai 2026.</p>
    </LegalShell>
  )
}
