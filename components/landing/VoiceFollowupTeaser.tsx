'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { FileText, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
import { BOOKING_URL } from '@/lib/site'
import { trackConversion } from '@/lib/conversionTracking'

/**
 * Zweiter Wow-Moment — feuert nach dem ersten Voice-Demo-Start.
 *
 * Logik:
 *  - Lauscht auf das GA4-Event 'voice_demo_start' (via window-Event-Bus),
 *    weil VoiceConsole eine isolierte iframe-aehnliche Komponente ist
 *    und kein direkter Render-Sibling.
 *  - Zeigt 8 Sek nach dem ersten Mic-Klick eine Toast-aehnliche Karte
 *    von oben rechts: "So sehen Sie das Gespräch im Dashboard" mit
 *    Mini-Transkript-Vorschau und CTA zur Termin-Buchung.
 *  - Maximal 1× pro Session (sessionStorage Flag).
 *  - Dismissable.
 *
 * Marketing-Logik: erster Wow = "die KI nimmt ab". Zweiter Wow = "und
 * du siehst das strukturiert in deinem Dashboard". Der Wow-Bogen
 * schliesst sich vom Erlebnis zum Produkt-Nutzen.
 */
const SESSION_KEY = 'candiq_voice_followup_shown'
const DELAY_MS = 8000

export function VoiceFollowupTeaser() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(SESSION_KEY)) return

    // Wir intercepten gtag-Aufrufe transparent — keine Modifikation des
    // VoiceConsole-Codes notwendig, kein direkter prop-drilling-Hack.
    const origGtag = window.gtag
    const hookedGtag: typeof window.gtag = (cmd, event, params) => {
      if (cmd === 'event' && event === 'conversion_step' && params?.step === 'voice_demo_start') {
        // Erstes Mic-Klick erkannt — Timer fuer Followup starten.
        setTimeout(() => {
          if (!sessionStorage.getItem(SESSION_KEY)) {
            sessionStorage.setItem(SESSION_KEY, '1')
            setVisible(true)
            trackConversion('cta_click', { cta_label: 'voice_followup_shown' })
          }
        }, DELAY_MS)
      }
      return origGtag?.(cmd, event, params)
    }
    window.gtag = hookedGtag
    return () => {
      window.gtag = origGtag
    }
  }, [])

  function close() {
    setDismissed(true)
    setVisible(false)
  }

  if (dismissed) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-20 right-4 left-4 sm:left-auto sm:right-6 sm:max-w-md z-40"
          role="dialog"
          aria-label="Was Sie im Dashboard sehen"
        >
          <div className="relative rounded-2xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50/50 to-white shadow-2xl shadow-indigo-500/20 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500" />

            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-text-muted uppercase tracking-widest">
                    Und dann?
                  </div>
                </div>
                <button
                  onClick={close}
                  aria-label="Schließen"
                  className="text-text-muted hover:text-text-primary text-sm leading-none p-1 -m-1"
                >
                  ✕
                </button>
              </div>

              <div className="text-base font-bold text-text-primary leading-tight mb-3">
                So sehen Sie das Gespräch im Dashboard.
              </div>

              {/* Mini-Transkript-Mock — vermittelt das Produktversprechen */}
              <div className="rounded-xl bg-white border border-border p-3 mb-3 space-y-2">
                <div className="flex items-start gap-2 text-xs">
                  <FileText className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-text-muted text-[10px] uppercase tracking-widest font-semibold">Auto-Transkript</div>
                    <div className="text-text-primary mt-0.5">
                      &bdquo;Ich war von 2019 bis 2024 als Senior DevOps Engineer
                      bei CloudScale t&auml;tig &hellip;&ldquo;
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs border-t border-border pt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-text-muted text-[10px] uppercase tracking-widest font-semibold">Strukturiert extrahiert</div>
                    <div className="text-text-primary mt-0.5">
                      <span className="font-medium">CloudScale GmbH</span> ·
                      Senior DevOps Engineer · 03/2019–08/2024
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                Jedes Wort des Kandidaten wird strukturiert ins Dashboard
                übertragen — geschulte Reviewer prüfen und geben frei.
              </p>

              <Link
                href={BOOKING_URL}
                onClick={() => {
                  trackConversion('cta_click', { cta_label: 'voice_followup_booking' })
                  close()
                }}
                className="btn-primary text-xs py-2.5 px-4 w-full flex items-center justify-center gap-1.5 group"
              >
                Dashboard live in 15 Min ansehen
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
