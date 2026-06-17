import type { Metadata } from 'next'
import { LandingNav } from '@/components/landing/LandingNav'
import { JsonLd } from '@/components/JsonLd'
import { pageMeta, softwareApplicationJsonLd, serviceJsonLd, faqJsonLd } from '@/lib/seo'
import { Hero } from '@/components/landing/sections/Hero'
import { TrustBar } from '@/components/landing/sections/TrustBar'
import { Problem } from '@/components/landing/sections/Problem'
import { SpeedAndProof } from '@/components/landing/sections/SpeedAndProof'
import { FabricationCheck } from '@/components/landing/sections/FabricationCheck'
import { HowItWorks } from '@/components/landing/sections/HowItWorks'
import { Features } from '@/components/landing/sections/Features'
import { Testimonials } from '@/components/landing/sections/Testimonials'
import { ROICalculator } from '@/components/landing/sections/ROICalculator'
import { PricingPreview } from '@/components/landing/sections/PricingPreview'
import { HomepageFaq } from '@/components/landing/sections/HomepageFaq'
import { FinalCta } from '@/components/landing/sections/FinalCta'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { StickyVoiceCta } from '@/components/landing/StickyVoiceCta'
import { VoiceFollowupTeaser } from '@/components/landing/VoiceFollowupTeaser'

export const metadata: Metadata = {
  ...pageMeta({
    title: 'candiq — DSGVO-konforme Referenzprüfung für Recruiting',
    description:
      'candiq verifiziert Referenzen, Zeugnisse und Tätigkeiten Ihrer Kandidaten — DSGVO-konform, in unter 48 Stunden. Vermeiden Sie kostspielige Fehlbesetzungen.',
    path: '/',
    ogTitle: 'candiq — DSGVO-konforme Referenzprüfung für Recruiting',
    enPath: '/en',
  }),
  // Startseite: Title ohne Template-Suffix (enthält die Marke bereits).
  title: { absolute: 'candiq — DSGVO-konforme Referenzprüfung für Recruiting' },
}

// FAQ-Plaintext fuer FAQPage-JSON-LD (GEO + Rich Results).
// MUSS textgleich zu den sichtbaren Antworten in components/landing/sections/HomepageFaq.tsx bleiben.
const HOMEPAGE_FAQ: Array<{ q: string; a: string }> = [
  { q: 'Ist candiq DSGVO-konform?', a: 'Ja, by Design. Unser Bewerber-Portal sammelt eine granulare Einwilligung nach Art. 6 Abs. 1 lit. a + Art. 7 DSGVO - der Kandidat sieht, welche Daten erhoben, welchen Referenzgebern Fragen gestellt und wie lange gespeichert wird. Alle Daten liegen in einem deutschen EU-Rechenzentrum, wir stellen einen AVV beim Onboarding bereit und die Einwilligung ist jederzeit widerrufbar.' },
  { q: 'Wie bekommen meine Bewerber die Einwilligung?', a: 'Sie legen den Kandidaten in candiq an - er bekommt eine personalisierte Einladungs-Mail mit Link zum Self-Service-Portal. Dort laedt er seinen CV hoch, benennt selbst die Referenzgeber und akzeptiert granular die Verarbeitung. Erst danach starten wir den Check. Der ganze Workflow ist EuGH-Planet49-konform und protokolliert im Audit-Log.' },
  { q: 'Wie schnell ist der erste Report da?', a: 'Der Report liegt in unter 48 Stunden ab freigegebenem Auftrag vor (Express-Option: 24 Stunden). Beim allerersten Mal kommt das Onboarding hinzu - vom Kennenlern-Termin ueber die Bewerber-Einladung bis zum ersten Report sind es typischerweise rund 7 Tage. Danach laeuft jede weitere Pruefung in unter 48 Stunden.' },
  { q: 'Kann ich monatlich kuendigen?', a: 'Ja. Professional und Business sind monatlich kuendbar zum Monatsende. Starter ist als Einstieg ohne Mindestlaufzeit gedacht. Bei Enterprise-Vertraegen mit 50+ Sitzen sprechen wir individuelle Kuendigungsfristen ab.' },
  { q: 'Was passiert mit den Daten nach dem Hire?', a: 'Ein automatischer Cron-Job loescht alle Bewerber-Daten 180 Tage nach Abschluss (Status COMPLETED, REJECTED oder CONSENT_REVOKED) - inkl. CV, Dokumente und Referenz-Antworten. Audit-Logs bleiben gemaess gesetzlicher Nachweispflicht nach Paragraph 257 HGB / Art. 7 DSGVO. Sie koennen jederzeit manuell frueher loeschen via Dashboard-Self-Service.' },
  { q: 'Bietet ihr branchen-spezifische Templates?', a: 'Ja. Der Deep-Check (60-Min-Interview) und das CV-Screening sind vertikal anpassbar - Tech, Sales, Healthcare, Operations und mehr. Fragenkataloge, Kompetenz-Scorecards und Cultural-Fit-Dimensionen werden auf Ihre Anforderungen zugeschnitten.' },
  { q: 'Was kostet ein einzelner Refcheck?', a: 'Ein Einzel-Refcheck ohne Paket-Bindung kostet 49 Euro netto. Im 5er-Pack 39,80 Euro (199 Euro Bundle, 19 % guenstiger), im 10er-Pack 34,90 Euro (349 Euro Bundle, 29 % guenstiger). Pakete sind 12 Monate gueltig. Volumen-Kunden erhalten zusaetzliche Rabatte.' },
  { q: 'Wie funktionieren Datenexport und Recht auf Vergessenwerden?', a: 'Beides Self-Service im Dashboard. Art. 20 DSGVO (Datenportabilitaet): Sie exportieren alle Daten eines Kandidaten als JSON+PDF per Klick. Art. 17 DSGVO (Loeschung): gleicher Self-Service, mit Bestaetigungs-Dialog, der gesetzlich aufbewahrungspflichtige Datensaetze markiert. Bewerber koennen ihre Einwilligung ausserdem jederzeit selbst widerrufen.' },
  { q: 'Was passiert mit dem CV, den wir hochladen?', a: 'Der CV ist ein personenbezogenes Datum des Bewerbers. Ihr seid Verantwortlicher, candiq Auftragsverarbeiter (AVV nach Art. 28). Wir verarbeiten den CV nur weisungsgebunden in eurem Auftrag, auf Servern in Deutschland, und loeschen ihn automatisch nach spaetestens 6 Monaten.' },
  { q: 'Duerfen wir als Kunde den CV hochladen, oder muss das der Bewerber tun?', a: 'Beides geht. Der Bewerber kann seinen CV selbst im Self-Service-Portal hochladen, oder ihr ladet ihn hoch. In beiden Faellen gilt dieselbe Regel: Geprueft wird erst, nachdem der Bewerber eingewilligt hat. Laedt der Kunde den CV hoch, geht automatisch ein Einladungslink an den Bewerber - erst nach seiner Freigabe bekommt ein Reviewer Zugriff.' },
  { q: 'Brauchen wir eine Einwilligung des Bewerbers?', a: 'Ja, und candiq holt sie strukturiert ein. Der Bewerber erteilt die Einwilligung selbst ueber einen Magic-Link, sieht transparent, was geprueft wird, waehlt die Scopes (Stationen / Referenzgeber / CV-Abgleich) granular und nennt seine Referenzgeber selbst. Ihr klickt nie stellvertretend "der Kandidat hat zugestimmt". Audit-Trail mit Zeit, IP und Consent-Version inklusive (Art. 7 Abs. 1).' },
  { q: 'Was, wenn der CV ein Foto, Religion oder Gesundheitsdaten enthaelt?', a: 'Unsere Reviewer pruefen ausschliesslich nachpruefbare Fakten - Position, Zeitraum, Aufgaben. Geschuetzte Merkmale (Herkunft, Religion, Gesundheit etc.) werden fuer die Pruefung nicht bewertet, AGG-konform. Besondere Kategorien aus dem CV fliessen nicht in die Bewertung ein.' },
  { q: 'Wo liegen die Daten und wie lange?', a: 'Server in Deutschland (EU-Region Frankfurt). Auto-Loeschung nach spaetestens 6 Monaten (Art. 5 Abs. 1 e). Widerruf jederzeit per Link (Art. 7 Abs. 3). AVV nach Art. 28 standardmaessig inklusive.' },
]

export default function LandingPage() {
  // 3-Akt-Dramaturgie statt 18-Sektion-Liste:
  // Akt 1 (Wow + USP-Probe):   Hero -> FabricationCheck (CV-Fabrikations-
  //                            Demo direkt im Browser — starker USP,
  //                            bewusst hoch geholt aus Founder-Feedback)
  //                            -> ROI-Rechner (Money-Math)
  //                            -> TrustBar
  // Akt 2 (Beweis):            Problem -> SpeedAndProof -> HowItWorks
  //                            -> Features -> Testimonials
  // Akt 3 (Entscheidung):      PricingPreview -> HomepageFaq -> FinalCta
  //
  // ROI-Vollversion bleibt parallel auf /roi-rechner als eigene SEO-Page
  // erreichbar (Geo-Targeting, Direct-Linking, deeper Drill-Down).
  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={serviceJsonLd()} />
      <JsonLd data={faqJsonLd(HOMEPAGE_FAQ)} />
      <LandingNav />
      <main id="main">
        {/* Akt 1: Wow + USP-Probe + Money-Math */}
        <Hero />
        <FabricationCheck />
        <ROICalculator />
        <TrustBar />

        {/* Akt 2: Beweis */}
        <Problem />
        <SpeedAndProof />
        <HowItWorks />
        <Features />
        <Testimonials />

        {/* Akt 3: Entscheidung */}
        <PricingPreview />
        <HomepageFaq />
        <FinalCta />
      </main>
      <LandingFooter />
      <StickyVoiceCta />
      <VoiceFollowupTeaser />
    </div>
  )
}
