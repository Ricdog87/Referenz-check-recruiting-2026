import { LegalShell } from '@/components/landing/LegalShell'

export const metadata = {
  title: 'Impressum — RefCheck',
}

export default function ImpressumPage() {
  return (
    <LegalShell title="Impressum" subtitle="Angaben gemäß § 5 TMG / § 55 Abs. 2 RStV">
      <h2>RefCheck Solutions GmbH</h2>
      <p>
        [Straße und Hausnummer]<br />
        [PLZ Ort]<br />
        Deutschland
      </p>

      <h3>Kontakt</h3>
      <p>
        Telefon: [+49 …]<br />
        E-Mail: <a href="mailto:hello@refcheck.de">hello@refcheck.de</a>
      </p>

      <h3>Registereintrag</h3>
      <p>
        Eintragung im Handelsregister<br />
        Registergericht: Amtsgericht [Ort]<br />
        Registernummer: HRB [...]
      </p>

      <h3>Umsatzsteuer-ID</h3>
      <p>USt-IdNr. nach § 27 a UStG: DE [...]</p>

      <h3>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h3>
      <p>
        [Name der verantwortlichen Person]<br />
        [Anschrift wie oben]
      </p>

      <h3>Streitschlichtung</h3>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{' '}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          https://ec.europa.eu/consumers/odr
        </a>. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <p className="text-text-muted text-xs mt-12">
        Bitte ersetzen Sie die Platzhalter mit Ihren tatsächlichen Unternehmensdaten vor dem Live-Gang.
      </p>
    </LegalShell>
  )
}
