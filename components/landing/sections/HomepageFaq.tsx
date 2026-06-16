'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'

type Faq = {
  q: string
  a: React.ReactNode
}

const FAQS: Faq[] = [
  {
    q: 'Ist candiq DSGVO-konform?',
    a: (
      <>
        Ja, &bdquo;by Design&ldquo;. Unser Bewerber-Portal sammelt eine{' '}
        <strong>granulare Einwilligung nach Art. 6 Abs. 1 lit. a + Art. 7 DSGVO</strong>{' '}
        — der Kandidat sieht, welche Daten erhoben, welchen Referenzgebern Fragen gestellt
        und wie lange gespeichert wird. Alle Daten liegen in einem deutschen EU-Rechenzentrum,
        wir stellen einen AVV beim Onboarding bereit und die Einwilligung ist jederzeit
        widerrufbar.
      </>
    ),
  },
  {
    q: 'Wie bekommen meine Bewerber die Einwilligung?',
    a: (
      <>
        Sie legen den Kandidaten in candiq an — er bekommt eine personalisierte
        Einladungs-Mail mit Link zum <strong>Self-Service-Portal</strong>. Dort
        lädt er seinen CV hoch, benennt selbst die Referenzgeber und akzeptiert
        granular die Verarbeitung. Erst danach starten wir den Check. Der ganze
        Workflow ist EuGH-Planet49-konform und protokolliert im Audit-Log.
      </>
    ),
  },
  {
    q: 'Wie schnell ist der erste Report da?',
    a: (
      <>
        Der <strong>Report liegt in unter 48 Stunden</strong> ab freigegebenem
        Auftrag vor (Express-Option: 24 h). Beim allerersten Mal kommt das
        Onboarding hinzu — vom Kennenlern-Termin über die Bewerber-Einladung bis
        zum ersten Report sind es typischerweise rund 7 Tage. Danach läuft jede
        weitere Prüfung in unter 48 Stunden.
      </>
    ),
  },
  {
    q: 'Kann ich monatlich kündigen?',
    a: (
      <>
        Ja. <strong>Professional</strong> und <strong>Business</strong> sind monatlich
        kündbar zum Monatsende. Starter ist als Einstieg ohne Mindestlaufzeit
        gedacht. Bei Enterprise-Verträgen mit 50+ Sitzen sprechen wir individuelle
        Kündigungsfristen ab.
      </>
    ),
  },
  {
    q: 'Was passiert mit den Daten nach dem Hire?',
    a: (
      <>
        Ein <strong>automatischer Cron-Job löscht alle Bewerber-Daten 180 Tage</strong>{' '}
        nach Abschluss (Status COMPLETED, REJECTED oder CONSENT_REVOKED) — inkl.
        CV, Dokumente und Referenz-Antworten. Audit-Logs bleiben (gesetzliche
        Nachweispflicht nach § 257 HGB / Art. 7 DSGVO). Sie können jederzeit
        manuell früher löschen via Dashboard-Self-Service.
      </>
    ),
  },
  {
    q: 'Bietet ihr branchen-spezifische Templates?',
    a: (
      <>
        Ja. Der Deep-Check (60-Min-Interview) und das CV-Screening sind vertikal
        anpassbar — Tech, Sales, Healthcare, Operations und mehr. Fragenkataloge,
        Kompetenz-Scorecards und Cultural-Fit-Dimensionen werden auf Ihre
        Anforderungen zugeschnitten. Übersicht aller Add-ons:{' '}
        <Link href="/preise#addons" className="text-brand-600 hover:underline font-medium">
          /preise#addons
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Was kostet ein einzelner Refcheck?',
    a: (
      <>
        Ein Einzel-Refcheck ohne Paket-Bindung kostet <strong>49 € netto</strong>. Im
        5er-Pack <strong>39,80 €</strong> (199 € Bundle, 19 % günstiger), im 10er-Pack{' '}
        <strong>34,90 €</strong> (349 € Bundle, 29 % günstiger). Pakete sind 12 Monate
        gültig. Volumen-Kunden erhalten zusätzliche Rabatte — Details unter{' '}
        <Link href="/preise" className="text-brand-600 hover:underline font-medium">
          /preise
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Wie funktionieren Datenexport und Recht auf Vergessenwerden?',
    a: (
      <>
        Beides Self-Service im Dashboard. <strong>Art. 20 DSGVO (Datenportabilität)</strong>:
        Sie exportieren alle Daten eines Kandidaten als JSON+PDF per Klick.{' '}
        <strong>Art. 17 DSGVO (Löschung)</strong>: gleicher Self-Service, mit
        Bestätigungs-Dialog, der gesetzlich aufbewahrungspflichtige Datensätze
        (Rechnungen, Audit-Trail) markiert. Bewerber können ihre Einwilligung
        außerdem jederzeit selbst widerrufen über ihren Portal-Link.
      </>
    ),
  },
]

export function HomepageFaq() {
  return (
    <section className="py-24 px-6 bg-white" id="faq">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            Häufige Fragen
          </div>
          <h2 className="text-4xl font-bold tracking-tighter mb-3 text-text-primary">
            Was Sie vor dem ersten Termin wissen sollten
          </h2>
          <p className="text-text-secondary">
            Direkte Antworten auf die acht Fragen, die uns am häufigsten gestellt werden.
          </p>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-text-secondary">
            Andere Frage?{' '}
            <a
              href="mailto:hello@candiq.de?subject=Frage%20zu%20candiq"
              className="text-brand-600 hover:underline font-medium"
            >
              hello@candiq.de
            </a>{' '}
            — wir antworten innerhalb eines Werktages.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      className="card-md cursor-pointer"
      onClick={() => setOpen((v) => !v)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="font-semibold text-text-primary">{q}</div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden
        >
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        </motion.div>
      </div>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="text-sm text-text-secondary leading-relaxed pt-3">{a}</div>
      </motion.div>
    </motion.div>
  )
}
