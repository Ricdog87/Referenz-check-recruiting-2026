'use client'

import { usePathname } from 'next/navigation'

/**
 * Stripped-down LocaleSwitcher — uses ONLY `usePathname` from
 * `next/navigation` (no next-intl hooks, no NextIntlClientProvider
 * required). Safe to mount on every page, including non-i18n routes.
 *
 * Behaviour:
 *  - On `/`, `/preise`, `/demo`, etc. → shows "DE | EN", EN active means /en
 *  - On `/en` → toggle back to `/`
 *  - Stores user preference in `NEXT_LOCALE` cookie (1y), so future
 *    visits can default to the chosen locale at the entry-page.
 *  - Plain `<a>` link (full navigation) — avoids client-side hydration
 *    issues with framer-motion in the parent nav.
 */
export function LocaleSwitcher() {
  const pathname = usePathname() ?? '/'
  const isEn = pathname.startsWith('/en')

  function setCookie(value: 'de' | 'en') {
    if (typeof document === 'undefined') return
    document.cookie = `NEXT_LOCALE=${value}; path=/; max-age=31536000; samesite=lax`
  }

  return (
    <div
      role="group"
      aria-label="Language / Sprache"
      className="hidden md:flex items-center gap-0.5 rounded-full border border-border bg-white p-0.5"
    >
      <a
        href="/"
        onClick={() => setCookie('de')}
        aria-current={!isEn ? 'true' : undefined}
        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-colors ${
          !isEn
            ? 'bg-brand-600 text-white'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        DE
      </a>
      <a
        href="/en"
        onClick={() => setCookie('en')}
        aria-current={isEn ? 'true' : undefined}
        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-colors ${
          isEn
            ? 'bg-brand-600 text-white'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        EN
      </a>
    </div>
  )
}
