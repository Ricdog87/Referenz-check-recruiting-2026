'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, ShieldCheck, X } from 'lucide-react'

const STORAGE_KEY = 'candiq.cookie.consent.v1'

/**
 * DSGVO-bewusster Cookie-Hinweis.
 *
 * candiq setzt **keine** Tracking-Cookies — nur den NextAuth-Session-Cookie,
 * der unter „technisch notwendig" (Art. 6 Abs. 1 lit. f / TTDSG § 25 Abs. 2)
 * fällt und keine explizite Einwilligung braucht.
 *
 * Dieser Banner ist eine ehrliche, sachliche Information für Erstbesucher,
 * keine Cookie-Wall: Es gibt nichts abzulehnen, weil nichts gesetzt wird,
 * was Einwilligung bräuchte. Der Banner verschwindet beim Klick und merkt
 * sich das in localStorage (clientseitig, kein Server-Request).
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (!seen) setVisible(true)
    } catch {
      // localStorage nicht verfügbar (Private Mode etc.) → Banner nicht zeigen
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    } catch { /* noop */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-slide-up"
    >
      <div className="rounded-2xl bg-white border border-border shadow-card-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 flex-shrink-0">
            <Cookie className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div id="cookie-consent-title" className="text-sm font-bold text-text-primary mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Hinweis zu Cookies
            </div>
            <p className="text-[12px] text-text-secondary leading-relaxed mb-3">
              candiq setzt nur einen <strong>technisch notwendigen Session-Cookie</strong> für die Anmeldung
              (NextAuth) — keine Tracking-, Analyse- oder Marketing-Cookies. Daher ist hier nichts zu
              entscheiden, nur zu wissen.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-full bg-gradient-to-r from-brand-500 to-violet shadow-card hover:shadow-glow transition-shadow"
              >
                Verstanden
              </button>
              <Link
                href="/datenschutz"
                className="text-[11px] font-semibold text-text-secondary hover:text-text-primary"
              >
                Datenschutz lesen
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Hinweis schließen"
            className="text-text-muted hover:text-text-primary p-1 -m-1 rounded-md flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
