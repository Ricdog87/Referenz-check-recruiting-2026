import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AGB — RefCheck',
  description: 'Allgemeine Geschäftsbedingungen der RefCheck Plattform',
}

export default function AgbPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <nav
        className="border-b border-border px-6 h-16 flex items-center justify-between max-w-4xl mx-auto"
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">RC</span>
          </div>
          <span className="font-semibold">RefCheck</span>
        </Link>
        <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
          ← Zurück
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Allgemeine Geschäftsbedingungen</h1>
          <p className="text-sm text-text-muted">Stand: April 2026</p>
        </div>

        <div className="text-sm text-text-secondary space-y-8 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">§ 1 Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen dem Betreiber der
              RefCheck-Plattform (nachfolgend „Anbieter") und gewerblichen Nutzern (nachfolgend „Kunde") über
              die Nutzung der SaaS-Plattform RefCheck zur Verwaltung und Dokumentation von Referenzprüfungen
              im Recruiting.
            </p>
            <p className="mt-2">
              Abweichende, entgegenstehende oder ergänzende Allgemeine Geschäftsbedingungen des Kunden werden
              nur Vertragsbestandteil, wenn und soweit der Anbieter ihrer Geltung ausdrücklich schriftlich
              zugestimmt hat.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">§ 2 Vertragsgegenstand</h2>
            <p>
              Der Anbieter stellt dem Kunden über das Internet eine Software-as-a-Service (SaaS)-Plattform
              zur Verfügung. Die Plattform ermöglicht:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Anlage und Verwaltung von Kandidatenprofilen</li>
              <li>Dokumentation von Referenzprüfungen bei früheren Arbeitgebern</li>
              <li>Upload und sichere Speicherung von Bewerbungsunterlagen</li>
              <li>DSGVO-konformes Einwilligungsmanagement</li>
              <li>Export und Löschung gespeicherter Daten gemäß DSGVO</li>
            </ul>
            <p className="mt-2">
              Der Anbieter führt selbst keine Referenzprüfungen durch. Die Plattform dient ausschließlich
              der softwaregestützten Verwaltung und Dokumentation durch den Kunden.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">§ 3 Vertragsschluss und Nutzungskonto</h2>
            <p>
              Der Vertrag kommt durch Registrierung des Kunden auf der Plattform und Bestätigung der AGB
              sowie Datenschutzerklärung zustande. Voraussetzung ist, dass der Kunde ein Unternehmen oder
              eine gewerblich tätige Person ist (B2B). Die Nutzung durch Verbraucher ist ausgeschlossen.
            </p>
            <p className="mt-2">
              Der Kunde ist verpflichtet, seine Zugangsdaten vertraulich zu behandeln und unbefugte
              Dritte vom Zugang zur Plattform auszuschließen. Bei Verdacht auf Missbrauch ist der
              Anbieter unverzüglich zu informieren.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">§ 4 Leistungsumfang und Verfügbarkeit</h2>
            <p>
              Der Anbieter stellt die Plattform mit einer angestrebten Verfügbarkeit von 99 % im
              Jahresdurchschnitt bereit. Hiervon ausgenommen sind geplante Wartungsfenster und Ausfälle,
              die außerhalb des Einflussbereichs des Anbieters liegen (höhere Gewalt, Drittanbieterstörungen).
            </p>
            <p className="mt-2">
              Der Anbieter ist berechtigt, die Plattform weiterzuentwickeln und den Funktionsumfang
              zu ändern, sofern dies dem Kunden zumutbar ist und die vertraglich vereinbarten
              Kernfunktionen erhalten bleiben.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">§ 5 Pflichten des Kunden</h2>
            <p>Der Kunde ist verpflichtet:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>
                Die Plattform ausschließlich in Übereinstimmung mit geltendem Recht zu nutzen,
                insbesondere DSGVO, BDSG und arbeitsrechtlichen Vorschriften
              </li>
              <li>
                Für jede verarbeitete Person eine ausreichende Rechtsgrundlage (z. B. Einwilligung
                gem. Art. 6 Abs. 1 lit. a DSGVO) sicherzustellen und zu dokumentieren
              </li>
              <li>
                Kandidaten über die Referenzprüfung und Datenverarbeitung zu informieren
              </li>
              <li>
                Keine rechtswidrigen, beleidigenden oder Rechte Dritter verletzenden Inhalte
                hochzuladen oder zu speichern
              </li>
              <li>
                Die Zugangsdaten zum Konto geheimzuhalten und Dritten nicht zugänglich zu machen
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">§ 6 Datenschutz und Auftragsverarbeitung</h2>
            <p>
              Soweit der Kunde über die Plattform personenbezogene Daten Dritter (insbesondere
              Kandidaten) verarbeitet, ist der Anbieter Auftragsverarbeiter im Sinne von Art. 28 DSGVO.
              Ein Auftragsverarbeitungsvertrag (AVV) wird auf Anfrage bereitgestellt.
            </p>
            <p className="mt-2">
              Der Anbieter verarbeitet die Daten ausschließlich weisungsgemäß und auf deutschen
              Servern. Einzelheiten regelt die Datenschutzerklärung.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">§ 7 Haftung</h2>
            <p>
              Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers
              oder der Gesundheit sowie für vorsätzliche und grob fahrlässige Pflichtverletzungen.
            </p>
            <p className="mt-2">
              Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten (Kardinalpflichten)
              ist die Haftung auf den vertragstypisch vorhersehbaren Schaden begrenzt. Eine weitergehende
              Haftung des Anbieters ist ausgeschlossen.
            </p>
            <p className="mt-2">
              Der Anbieter haftet nicht für die inhaltliche Richtigkeit der vom Kunden eingegebenen
              Daten sowie für Schäden, die aus einer nicht DSGVO-konformen Nutzung durch den Kunden
              entstehen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">§ 8 Laufzeit und Kündigung</h2>
            <p>
              Der Vertrag wird auf unbestimmte Zeit geschlossen. Beide Parteien können den Vertrag
              jederzeit ohne Einhaltung einer Frist kündigen. Der Kunde kann sein Konto jederzeit
              über den Einstellungsbereich der Plattform löschen (Art. 17 DSGVO).
            </p>
            <p className="mt-2">
              Bei schwerwiegenden Verstößen gegen diese AGB ist der Anbieter berechtigt, den Zugang
              des Kunden fristlos zu sperren oder zu kündigen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">§ 9 Änderungen der AGB</h2>
            <p>
              Der Anbieter behält sich vor, diese AGB mit angemessener Vorankündigungsfrist
              (mindestens 4 Wochen) zu ändern. Änderungen werden dem Kunden per E-Mail mitgeteilt.
              Widerspricht der Kunde nicht innerhalb von 4 Wochen nach Erhalt der Mitteilung,
              gelten die geänderten AGB als akzeptiert.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">§ 10 Anwendbares Recht und Gerichtsstand</h2>
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
              UN-Kaufrechts (CISG).
            </p>
            <p className="mt-2">
              Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesem Vertrag
              ist, sofern der Kunde Kaufmann ist, der Sitz des Anbieters.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">§ 11 Salvatorische Klausel</h2>
            <p>
              Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, berührt dies
              die Wirksamkeit der übrigen Bestimmungen nicht. Anstelle der unwirksamen Bestimmung
              gilt die gesetzliche Regelung.
            </p>
          </section>

        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-text-muted">
            Bei Fragen zu diesen AGB wenden Sie sich bitte an{' '}
            <Link href="/impressum" className="text-accent hover:underline">
              unsere Kontaktadresse
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
