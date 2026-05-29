'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Languages } from 'lucide-react'
import { usePathname, useRouter, routing, type Locale } from '@/i18n/routing'

/**
 * Minimaler Locale-Switcher. Behaelt den aktuellen Pfad bei und tauscht nur
 * den Locale-Prefix aus. `useTransition` verhindert UI-Sprung waehrend der
 * Server-Rerender laeuft.
 */
export function LocaleSwitcher({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const t = useTranslations('localeSwitcher')
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function switchTo(next: Locale) {
    if (next === locale) return
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  if (variant === 'mobile') {
    return (
      <div className="flex items-center gap-2 py-2">
        <Languages className="w-4 h-4 text-text-muted" aria-hidden />
        <span className="text-xs text-text-muted mr-2">{t('label')}:</span>
        {routing.locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => switchTo(l)}
            disabled={isPending}
            aria-current={l === locale ? 'true' : undefined}
            className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors ${
              l === locale
                ? 'bg-brand-50 text-brand-700 border border-brand-100'
                : 'text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            {t(l)}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="hidden md:flex items-center gap-1 rounded-full border border-border bg-white p-0.5">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          disabled={isPending}
          aria-label={`${t('label')}: ${t(l)}`}
          aria-current={l === locale ? 'true' : undefined}
          className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-colors ${
            l === locale
              ? 'bg-brand-600 text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
