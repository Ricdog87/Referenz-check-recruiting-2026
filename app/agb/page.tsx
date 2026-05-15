import { LegalShell } from '@/components/landing/LegalShell'

export const metadata = {
  title: 'AGB — candiq',
}

export default function AgbPage() {
  return (
    <LegalShell
      title="Allgemeine Geschäftsbedingungen"
      subtitle="Gültig für alle B2B-Kunden ab April 2026"
    >
      <h2>1. Geltungsbereich</h2>
      <p>
        Diese AGB gelten für alle Verträge zwischen der RSG Recruiting Solutions group GmbH („Anbieter&ldquo;) und
        Unternehmenskunden („Kunde&ldquo;) über die Nutzung der candiq-Plattform. Die Leistungen richten sich
        ausschließlich an Unternehmer im Sinne von § 14 BGB.
      </p>

      <h2>2. Vertragsgegenstand</h2>
      <p>
        Der Anbieter stellt eine SaaS-Plattform zur Verifizierung von Referenzen, Zeugnissen und
        Tätigkeiten von Bewerbern bereit. Der Funktionsumfang ergibt sich aus dem jeweils gewählten
        Paket (siehe <a href="/preise">Preisseite</a>).
      </p>

      <h2>3. Vertragsabschluss & Testzugang</h2>
      <p>
        Ein kostenpflichtiger Vertrag kommt erst mit ausdrücklicher Buchung eines Pakets durch den Kunden
        zustande. Vor der Buchung kann nach individueller Vereinbarung ein unverbindlicher, von uns
        bereitgestellter Testzugang genutzt werden; dieser ist kein Vertragsverhältnis im Sinne eines
        kostenpflichtigen Pakets. Während des Testzugangs entstehen für den Kunden keine Kosten.
      </p>

      <h2>4. Abonnement, Laufzeit, Kündigung</h2>
      <p>
        (1) Das Abonnement beginnt mit der Bestätigung der Bestellung durch candiq und der
        erfolgreichen Zahlung über Stripe.
      </p>
      <p>
        (2) Es läuft auf monatlicher oder jährlicher Basis (je nach gewähltem Tarif) und verlängert
        sich automatisch um einen weiteren Abrechnungszeitraum, sofern es nicht zum Ende des
        laufenden Zeitraums gekündigt wird.
      </p>
      <p>
        (3) Die Kündigung erfolgt formfrei über das Kundenportal (<a href="/settings/billing">/settings/billing</a>)
        oder per E-Mail an <a href="mailto:hello@candiq.de">hello@candiq.de</a>. Die Kündigung wird zum
        Ende des laufenden Abrechnungszeitraums wirksam.
      </p>
      <p>
        (4) Bis zum Ende des bezahlten Abrechnungszeitraums bleibt der Zugang zum SaaS bestehen.
      </p>

      <h2>5. Preise, Zahlung, Mehrwertsteuer</h2>
      <p>
        (1) Es gelten die zum Bestellzeitpunkt im Tarif-Plan ausgewiesenen Preise zzgl. der jeweils
        gesetzlichen Mehrwertsteuer.
      </p>
      <p>
        (2) B2B-Geschäftskunden mit gültiger USt-IdNr. innerhalb der EU (außerhalb Deutschlands)
        können bei Bestellung das Reverse-Charge-Verfahren in Anspruch nehmen; die USt-IdNr.
        wird im Stripe-Checkout abgefragt und automatisch geprüft.
      </p>
      <p>
        (3) Zahlung erfolgt im Voraus über Stripe per Kreditkarte, SEPA-Lastschrift, Apple Pay
        oder Google Pay.
      </p>
      <p>
        (4) Bei Zahlungsverzug ist candiq berechtigt, den Zugang nach zweiter Mahnung zu sperren
        und das Abonnement außerordentlich zu kündigen.
      </p>

      <h2>5a. Zielgruppe (B2B-Ausschluss Widerruf)</h2>
      <p>
        candiq richtet sich ausschließlich an Unternehmer im Sinne des § 14 BGB. Ein Widerrufsrecht
        nach § 355 BGB besteht für Geschäftskunden nicht.
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
        Stand: Mai 2026. Vor Live-Gang individuell anwaltlich prüfen lassen.
      </p>
    </LegalShell>
  )
}
