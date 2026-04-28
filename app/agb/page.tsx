import { LegalShell } from '@/components/landing/LegalShell'

export const metadata = {
  title: 'AGB — RefCheck',
}

export default function AgbPage() {
  return (
    <LegalShell
      title="Allgemeine Geschäftsbedingungen"
      subtitle="Gültig für alle B2B-Kunden ab April 2026"
    >
      <h2>1. Geltungsbereich</h2>
      <p>
        Diese AGB gelten für alle Verträge zwischen der RefCheck Solutions GmbH („Anbieter") und
        Unternehmenskunden („Kunde") über die Nutzung der RefCheck-Plattform. Die Leistungen richten sich
        ausschließlich an Unternehmer im Sinne von § 14 BGB.
      </p>

      <h2>2. Vertragsgegenstand</h2>
      <p>
        Der Anbieter stellt eine SaaS-Plattform zur Verifizierung von Referenzen, Zeugnissen und
        Tätigkeiten von Bewerbern bereit. Der Funktionsumfang ergibt sich aus dem jeweils gewählten
        Paket (siehe <a href="/preise">Preisseite</a>).
      </p>

      <h2>3. Vertragsabschluss & Testphase</h2>
      <p>
        Mit Registrierung kommt ein Vertrag über die kostenlose 14-tägige Testphase zustande. Eine
        kostenpflichtige Buchung erfordert die separate Auswahl eines Pakets und die Eingabe gültiger
        Zahlungsdaten. Vor Ablauf der Testphase werden keine Kosten berechnet.
      </p>

      <h2>4. Preise & Zahlungsbedingungen</h2>
      <ul>
        <li>Alle Preise verstehen sich zuzüglich der gesetzlichen Umsatzsteuer.</li>
        <li>Monatliche Pakete werden monatlich im Voraus abgerechnet, jährliche Pakete jährlich im Voraus.</li>
        <li>Über die Inklusiv-Prüfungen hinausgehende Reference-Checks werden zum Paketpreis nachberechnet.</li>
        <li>Zahlung per SEPA-Lastschrift, Kreditkarte oder Rechnung (ab Business-Paket).</li>
      </ul>

      <h2>5. Laufzeit & Kündigung</h2>
      <p>
        Monatliche Pakete sind monatlich zum Monatsende kündbar. Jährliche Pakete sind mit einer Frist
        von 30 Tagen zum Ende der Vertragslaufzeit kündbar. Die Kündigung ist im Dashboard oder per
        E-Mail an <a href="mailto:billing@refcheck.de">billing@refcheck.de</a> möglich.
      </p>

      <h2>6. Pflichten des Kunden</h2>
      <ul>
        <li>Der Kunde stellt sicher, dass für jeden Kandidaten eine wirksame DSGVO-Einwilligung vorliegt.</li>
        <li>Der Kunde nutzt die Plattform ausschließlich für legitime, berufsbezogene Verifizierungszwecke.</li>
        <li>Zugangsdaten sind vertraulich zu behandeln; der Kunde haftet für Missbrauch durch Dritte.</li>
      </ul>

      <h2>7. Service-Levels</h2>
      <ul>
        <li>Verfügbarkeit: 99,5 % im Jahresmittel (Starter/Professional), 99,9 % (Business/Enterprise).</li>
        <li>Reaktionszeit Support: ≤ 24 h (Starter), ≤ 8 h (Professional), ≤ 4 h (Business), ≤ 1 h (Enterprise).</li>
        <li>Durchlaufzeit Reference-Check: ø &lt; 48 h (Standard), &lt; 24 h (Express, gegen Aufpreis).</li>
      </ul>

      <h2>8. Haftung</h2>
      <p>
        Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei der Verletzung
        wesentlicher Vertragspflichten. Im Übrigen ist die Haftung auf den vertragstypischen, vorhersehbaren
        Schaden begrenzt. Eine Haftung für mittelbare Schäden, entgangenen Gewinn oder Datenverlust ist
        ausgeschlossen, soweit gesetzlich zulässig.
      </p>

      <h2>9. Datenschutz & Auftragsverarbeitung</h2>
      <p>
        Es gilt unsere <a href="/datenschutz">Datenschutzerklärung</a>. Sofern der Kunde Daten Dritter
        (Kandidaten) verarbeitet, kommt automatisch ein Vertrag zur Auftragsverarbeitung gemäß
        Art. 28 DSGVO zustande.
      </p>

      <h2>10. Schlussbestimmungen</h2>
      <ul>
        <li>Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.</li>
        <li>Gerichtsstand ist [Ort des Anbieters], sofern der Kunde Kaufmann ist.</li>
        <li>Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen unberührt.</li>
      </ul>

      <p className="text-text-muted text-xs mt-12">
        Stand: April 2026. Vor Live-Gang individuell anwaltlich prüfen lassen.
      </p>
    </LegalShell>
  )
}
