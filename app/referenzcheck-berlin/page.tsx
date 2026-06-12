import type { Metadata } from 'next'

const BASE_URL = 'https://www.candiq.de'

export const metadata: Metadata = {
  title: 'Referenzcheck Berlin | candiq – Software für Personaldienstleister',
  description: 'Referenzcheck-Software für Personaldienstleister in Berlin. candiq digitalisiert den Referenzcheck – DSGVO-konform, automatisiert und in Minuten statt Tagen. Jetzt Demo anfragen.',
  keywords: [
    'Referenzcheck Berlin',
    'Referenzcheck Personaldienstleister Berlin',
    'Referenzprüfung Berlin',
    'Reference Check Berlin',
    'HR Software Berlin',
    'Recruiting Software Berlin',
    'candiq Berlin',
    'DSGVO Referenzcheck Berlin',
  ],
  alternates: {
    canonical: BASE_URL + '/referenzcheck-berlin',
  },
}

export default function ReferenzcheckBerlin() {
  const schemaJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'SoftwareApplication'],
        '@id': BASE_URL + '/#organization',
        name: 'candiq – Referenzcheck für Personaldienstleister',
        legalName: 'RSG Recruiting Solutions Group GmbH',
        url: BASE_URL,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: 'Digitale Referenzcheck-Plattform für Personaldienstleister in Berlin und Brandenburg.',
        areaServed: {
          '@type': 'City',
          name: 'Berlin',
          sameAs: 'https://www.wikidata.org/wiki/Q64',
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Am Heiligenhaus 9',
          postalCode: '65207',
          addressLocality: 'Wiesbaden',
          addressRegion: 'Hessen',
          addressCountry: 'DE',
        },
        parentOrganization: {
          '@type': 'Organization',
          '@id': 'https://www.recruiting-sg.de/#organization',
          name: 'RSG Recruiting Solutions Group GmbH',
          url: 'https://www.recruiting-sg.de',
        },
        sameAs: ['https://www.recruiting-sg.de', 'https://www.rsg-ai.de'],
      },
    ],
  }

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-6">Referenzcheck Personaldienstleister Berlin</h1>
        <p className="text-xl text-gray-600 mb-8">
          candiq ist die digitale Referenzcheck-Lösung für Personaldienstleister in Berlin und
          Brandenburg. Automatisieren Sie Ihre Referenzprüfungen – DSGVO-konform, schnell und
          professionell.
        </p>
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Vorteile für Personaldienstleister in Berlin</h2>
            <ul className="space-y-3 text-gray-700">
              <li>✓ Referenzcheck in Minuten statt Tagen</li>
              <li>✓ 100 % DSGVO-konform & revisionssicher</li>
              <li>✓ Automatisierte Anfragen per E-Mail</li>
              <li>✓ Strukturierte Auswertung & PDF-Export</li>
              <li>✓ Für alle Branchen im Berliner Raum</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Für wen ist candiq?</h2>
            <ul className="space-y-3 text-gray-700">
              <li>✓ Personalvermittler & Headhunter</li>
              <li>✓ Zeitarbeitsfirmen & Staffing-Agenturen</li>
              <li>✓ HR-Abteilungen & Recruiting-Teams</li>
              <li>✓ Executive-Search-Berater</li>
            </ul>
          </div>
        </div>
        <a
          href="/demo"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
        >
          Kostenlose Demo anfragen
        </a>
        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Referenzcheck-Software auch in anderen Städten:</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <a href="/referenzcheck-frankfurt" className="text-blue-600 hover:underline">Frankfurt</a>
            <a href="/referenzcheck-muenchen" className="text-blue-600 hover:underline">München</a>
            <a href="/referenzcheck-hamburg" className="text-blue-600 hover:underline">Hamburg</a>
            <a href="/referenzcheck-koeln" className="text-blue-600 hover:underline">Köln</a>
          </div>
        </div>
      </section>
    </main>
  )
}
