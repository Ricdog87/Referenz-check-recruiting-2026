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
        Deutschland, verarbeitet. Eine Übermittlung personenbezogener Daten in Drittländer findet
        ausschließlich im Rahmen der Zahlungsabwicklung über Stripe statt (siehe Punkt 8) und beruht
        auf den EU-Standardvertragsklauseln nach Art. 46 Abs. 2 lit. c DSGVO.
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

      <h2>9. Cookies, Tracking und Reichweitenanalyse</h2>
      <p>
        Wir verwenden ausschließlich <strong>technisch notwendige Cookies</strong> (Session- und
        CSRF-Cookies für Authentifizierung). Es findet <strong>kein Tracking, kein Marketing-Pixel,
        keine Werbe- oder Profiling-Cookies, keine Reichweitenanalyse und kein A/B-Testing</strong>
        statt. Wir setzen keine externen Analyse-, Tracking-, Heatmapping- oder Session-Replay-Dienste
        ein.
      </p>
      <p>
        Hosting-bedingt protokolliert unser Hoster Vercel kurzlebige technische Logs (IP-Adresse,
        Zeitstempel, User-Agent, aufgerufene URL) zur Sicherstellung des Betriebs und zur Abwehr
        von Angriffen. Diese Logs werden nach spätestens 24 Stunden anonymisiert bzw. gelöscht.
        Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am sicheren Betrieb).
      </p>

      <h2>9a. HubSpot Live-Chat &amp; Terminbuchung</h2>
      <p>
        Auf candiq.de bieten wir einen <strong>Live-Chat zur Kontaktaufnahme</strong> sowie eine
        Terminbuchung &uuml;ber das HubSpot Meetings-Widget an. Anbieter ist die HubSpot Ireland
        Limited, 2nd Floor, 30 North Wall Quay, Dublin 1, D01 R0H8, Irland (im Folgenden
        &bdquo;HubSpot&ldquo;), als europ&auml;ische Tochter der HubSpot, Inc. (USA).
      </p>
      <p>
        Beim Aufruf einer Seite mit aktivem Chat- oder Meetings-Widget &uuml;bertr&auml;gt Ihr
        Browser folgende Daten an HubSpot: IP-Adresse, User-Agent, Spracheinstellung, aufgerufene
        URL, Zeitstempel sowie ggf. Cookie-IDs zur Wiedererkennung w&auml;hrend der Sitzung.
        Wenn Sie eine Nachricht im Chat senden oder ein Buchungs-Formular ausf&uuml;llen, werden
        zus&auml;tzlich die von Ihnen eingegebenen Informationen (z.&nbsp;B. Name, E-Mail-Adresse,
        Nachrichtentext) &uuml;bertragen und in unserem CRM gespeichert.
      </p>
      <p>
        <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an
        einer effizienten Kommunikation mit Interessenten und Kunden) sowie bei aktiver
        Kontaktanfrage Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Ma&szlig;nahmen).
      </p>
      <p>
        <strong>Drittland&uuml;bermittlung:</strong> Soweit personenbezogene Daten an HubSpot, Inc.
        in die USA &uuml;bermittelt werden, erfolgt dies auf Grundlage von Standardvertragsklauseln
        gem&auml;&szlig; Art. 46 Abs. 2 lit. c DSGVO. HubSpot, Inc. ist au&szlig;erdem unter dem
        EU-U.S. Data Privacy Framework zertifiziert.
      </p>
      <p>
        <strong>Auftragsverarbeitung:</strong> Auf Basis eines Auftragsverarbeitungsvertrags (DPA)
        nach Art. 28 DSGVO, abrufbar unter{' '}
        <a href="https://legal.hubspot.com/dpa" target="_blank" rel="noopener noreferrer">
          legal.hubspot.com/dpa
        </a>
        . Datenschutzerkl&auml;rung von HubSpot:{' '}
        <a href="https://legal.hubspot.com/de/privacy-policy" target="_blank" rel="noopener noreferrer">
          legal.hubspot.com/de/privacy-policy
        </a>
        .
      </p>
      <p>
        <strong>Speicherdauer:</strong> Chat-Verl&auml;ufe und Buchungsdaten werden f&uuml;r die
        Dauer der Gesch&auml;ftsbeziehung sowie zur Erf&uuml;llung gesetzlicher
        Aufbewahrungspflichten gespeichert. Sie k&ouml;nnen jederzeit per E-Mail an
        hello@candiq.de der Verarbeitung widersprechen (Art. 21 DSGVO).
      </p>

      <h2>9b. Pilot-Programm Q3/2026 &mdash; Bewerbungs-Formular</h2>
      <p>
        Auf candiq.de bieten wir Interessenten die M&ouml;glichkeit, sich f&uuml;r unser
        zeitlich begrenztes Pilot-Programm Q3/2026 zu bewerben. Erhoben werden dabei:
        Firmenname, Vor- und Nachname, gesch&auml;ftliche E-Mail-Adresse und die geplante
        Anzahl an Hires pro Jahr. Zus&auml;tzlich speichern wir Zeitstempel, IP-Adresse
        und User-Agent zur Missbrauchspr&auml;vention.
      </p>
      <p>
        <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) f&uuml;r
        die Bearbeitung der Pilot-Bewerbung sowie Art. 6 Abs. 1 lit. b DSGVO
        (vorvertragliche Ma&szlig;nahmen).
      </p>
      <p>
        <strong>Speicherdauer:</strong> Bewerbungen werden bis zum Ende des Pilot-Programms
        (max. 12 Monate Laufzeit + 24 Monate Nachweisfrist nach Art. 7 Abs. 1 DSGVO)
        gespeichert. Bewerbungen, die nicht zu einer Pilot-Teilnahme f&uuml;hren, werden
        sp&auml;testens nach 6 Monaten gel&ouml;scht. Sie k&ouml;nnen Ihre Einwilligung jederzeit
        per E-Mail an hello@candiq.de widerrufen.
      </p>
      <p>
        <strong>Anonymisierte Case-Study:</strong> Pilot-Teilnehmer verpflichten sich
        zu einer anonymisierten Case-Study nach 90 Tagen. Diese erfolgt ohne Klarnamen,
        ohne Firmenlogo und nur mit Ihrer ausdr&uuml;cklichen, schriftlichen Freigabe
        vor Ver&ouml;ffentlichung.
      </p>

      <h2>9c. Lead-Magnet-Anfragen</h2>
      <p>
        Auf candiq.de bieten wir kostenlose Praxis-Guides (Lead-Magnets) zum Download.
        Vor der Anzeige werden Vorname und gesch&auml;ftliche E-Mail-Adresse erhoben,
        optional auch Firmenname. Zus&auml;tzlich speichern wir Zeitstempel, IP-Adresse
        und User-Agent zur Missbrauchspr&auml;vention.
      </p>
      <p>
        <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)
        f&uuml;r die Zusendung des Inhalts.
      </p>
      <p>
        <strong>Newsletter (optional):</strong> Falls Sie das Newsletter-Kontrollk&auml;stchen
        aktivieren, senden wir eine separate Best&auml;tigungs-E-Mail
        (<strong>Double-Opt-In</strong>). Erst nach Klick auf den Best&auml;tigungs-Link
        werden Sie zum Newsletter hinzugef&uuml;gt. Ohne diesen Klick erfolgt keine
        Newsletter-Verarbeitung. Abmeldung jederzeit &uuml;ber den Link in jeder
        Newsletter-E-Mail.
      </p>
      <p>
        <strong>Speicherdauer:</strong> Lead-Magnet-Anfragen werden 24 Monate zur
        Nachweis-Pflicht (Art. 7 Abs. 1 DSGVO) gespeichert und anschlie&szlig;end
        gel&ouml;scht. Newsletter-Abonnenten bleiben gespeichert bis zur Abmeldung.
      </p>

      <h2>10. Aufbewahrungsfristen</h2>
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

      <h2>11. Stand</h2>
      <p>Diese Datenschutzerklärung wurde zuletzt aktualisiert: 28. Mai 2026.</p>
    </LegalShell>
  )
}
