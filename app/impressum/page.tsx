import { LegalShell } from '@/components/landing/LegalShell'

export const metadata = {
  title: 'Impressum — candiq',
}

export default function ImpressumPage() {
  return (
    <LegalShell title="Impressum" subtitle="Angaben gemäß § 5 TMG / § 55 Abs. 2 RStV">
      <p>
        <strong>candiq</strong> ist eine Marke der <strong>RSG Recruiting Solutions group GmbH</strong>.
      </p>

      <h2>RSG Recruiting Solutions group GmbH</h2>
      <p>
        Geschäftsführer: Ricardo Serrano<br />
        Am Heiligenhaus 9<br />
        65207 Wiesbaden<br />
        Deutschland
      </p>

      <h3>Kontakt</h3>
      <p>
        Telefon: +49 176 60772556<br />
        E-Mail: <a href="mailto:hello@candiq.de">hello@candiq.de</a>
      </p>

      <h3>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h3>
      <p>
        Ricardo Serrano<br />
        Am Heiligenhaus 9<br />
        65207 Wiesbaden
      </p>

      <h3>Streitschlichtung</h3>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{' '}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          https://ec.europa.eu/consumers/odr
        </a>. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </LegalShell>
  )
}
