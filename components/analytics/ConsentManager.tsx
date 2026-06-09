'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, X } from 'lucide-react'
import {
  readConsentCookie,
  writeConsentCookie,
  OPEN_CONSENT_EVENT,
  CONSENT_UPDATED_EVENT,
  type ConsentChoice,
} from '@/lib/consent'

declare global {
  interface Window {
    dataLayer?: unknown[]
    __candiqGaLoaded?: boolean
  }
}

/**
 * DSGVO-/TTDSG-konformes Consent-Management für Google Analytics 4.
 *
 * Prinzip: Vor aktiver Einwilligung wird KEIN GA-Script geladen und KEINE
 * Anfrage an Google gesendet (Opt-in). Erst bei „Akzeptieren" wird gtag.js
 * injiziert — über das bereits genoncte Next-Bundle, daher unter
 * `strict-dynamic` erlaubt.
 */
export function ConsentManager({ gaId }: { gaId: string }) {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analyticsChecked, setAnalyticsChecked] = useState(false)

  const loadGa = useCallback(() => {
    if (!gaId || window.__candiqGaLoaded) return
    window.__candiqGaLoaded = true

    window.dataLayer = window.dataLayer || []
    function gtag(...args: unknown[]) {
      window.dataLayer!.push(args)
    }
    // Consent Mode v2 — Default denied, dann gezielt analytics_storage granted.
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      wait_for_update: 500,
    })
    gtag('consent', 'update', { analytics_storage: 'granted' })
    gtag('js', new Date())
    gtag('config', gaId, { anonymize_ip: true })

    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`
    document.head.appendChild(s)
  }, [gaId])

  // Initial: Cookie prüfen. Bei vorhandener Einwilligung GA laden, sonst Banner.
  useEffect(() => {
    const c = readConsentCookie()
    if (c === null) {
      setVisible(true)
    } else if (c.analytics === 'granted') {
      setAnalyticsChecked(true)
      loadGa()
    }
  }, [loadGa])

  // Footer-Button „Cookie-Einstellungen" öffnet das Banner erneut.
  useEffect(() => {
    const open = () => {
      const c = readConsentCookie()
      setAnalyticsChecked(c?.analytics === 'granted')
      setShowDetails(true)
      setVisible(true)
    }
    window.addEventListener(OPEN_CONSENT_EVENT, open)
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open)
  }, [])

  const decide = useCallback(
    (analytics: ConsentChoice) => {
      writeConsentCookie(analytics)
      window.dispatchEvent(new CustomEvent(CONSENT_UPDATED_EVENT))
      if (analytics === 'granted') loadGa()
      setVisible(false)
      setShowDetails(false)
    },
    [loadGa],
  )

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie-Einstellungen"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[9998] p-4 sm:p-6"
    >
      <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-white shadow-card-xl p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-text-primary mb-1">Datenschutz-Einstellungen</h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Wir nutzen technisch notwendige Cookies (immer aktiv). Zusätzlich möchten wir mit Google
              Analytics anonymisiert messen, wie unsere Seite genutzt wird — nur mit Ihrer Einwilligung.
              Sie können frei wählen und Ihre Entscheidung jederzeit über &bdquo;Cookie-Einstellungen&ldquo; im
              Footer ändern. Details in der{' '}
              <Link href="/datenschutz" className="text-brand-700 font-semibold hover:underline">
                Datenschutzerklärung
              </Link>
              .
            </p>
          </div>
          <button
            onClick={() => decide('denied')}
            aria-label="Schließen und ablehnen"
            className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showDetails && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-border bg-bg-secondary px-4 py-3">
              <div>
                <div className="text-xs font-semibold text-text-primary">Technisch notwendig</div>
                <div className="text-[11px] text-text-muted">Erforderlich für Login & Sicherheit.</div>
              </div>
              <span className="text-[11px] font-semibold text-text-muted">Immer aktiv</span>
            </div>
            <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-text-primary">Statistik (Google Analytics 4)</div>
                <div className="text-[11px] text-text-muted">Anonymisierte Reichweitenmessung.</div>
              </div>
              <input
                type="checkbox"
                checked={analyticsChecked}
                onChange={(e) => setAnalyticsChecked(e.target.checked)}
                className="w-4 h-4 accent-brand-600"
              />
            </label>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          {showDetails ? (
            <button
              onClick={() => decide(analyticsChecked ? 'granted' : 'denied')}
              className="btn-primary text-sm py-2.5 px-5 order-1 sm:order-3"
            >
              Auswahl speichern
            </button>
          ) : (
            <button
              onClick={() => setShowDetails(true)}
              className="btn-secondary text-sm py-2.5 px-5 order-3 sm:order-1"
            >
              Einstellungen
            </button>
          )}
          <button
            onClick={() => decide('denied')}
            className="btn-secondary text-sm py-2.5 px-5 order-2"
          >
            Ablehnen
          </button>
          <button
            onClick={() => decide('granted')}
            className="btn-primary text-sm py-2.5 px-5 order-1 sm:order-3"
          >
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  )
}
