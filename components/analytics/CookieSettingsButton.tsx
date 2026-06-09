'use client'

import { OPEN_CONSENT_EVENT } from '@/lib/consent'

/** Öffnet das Consent-Banner erneut (Widerruf / Änderung jederzeit möglich). */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className={className ?? 'hover:text-text-primary transition-colors'}
    >
      Cookie-Einstellungen
    </button>
  )
}
