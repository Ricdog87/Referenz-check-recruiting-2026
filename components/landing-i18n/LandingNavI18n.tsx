'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Menu, X, Zap, CalendarCheck } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { BOOKING_URL } from '@/lib/site'
import { LocaleSwitcher } from './LocaleSwitcher'

/**
 * Locale-aware Variante der LandingNav (PR 1).
 * Verzichtet auf interne Marketing-Anker (#features, #wie-es-funktioniert),
 * weil die zugehoerigen Sektionen aktuell nur in der DE-Variante existieren.
 * In PR 2 wird die /en-Page um diese Sektionen ergaenzt — dann ziehen die
 * Anchor-Links hier nach.
 */
export function LandingNavI18n() {
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')
  const { scrollY } = useScroll()
  const blurOpacity = useTransform(scrollY, [0, 100], [0.5, 0.95])
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 0.08])
  const [open, setOpen] = useState(false)

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: useTransform(blurOpacity, (o) => `rgba(255,255,255,${o})`),
        borderBottom: useTransform(borderOpacity, (o) => `1px solid rgba(15,23,42,${o})`),
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" aria-label={t('ariaHomeLink')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="candiq" width={120} height={32} className="h-8 w-auto" />
          <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-widest text-brand-600 px-1.5 py-0.5 rounded-md bg-brand-50 border border-brand-100 ml-1">
            Pro
          </span>
        </Link>

        {/* Desktop nav — schlank gehalten fuer PR 1 (EN-MVP).
            In PR 2 kommen #features, #wie-es-funktioniert dazu. */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/preise" className="text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-2 rounded-lg transition-colors">
            {t('pricing')}
          </Link>
          <Link href="/demo" className="text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-2 rounded-lg transition-colors">
            {t('liveDemo')}
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <LocaleSwitcher />
          <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary px-4 py-2 rounded-full transition-colors">
            {t('signIn')}
          </Link>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            {tCommon('bookingCtaShort')}
          </a>
        </div>

        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? t('closeMenu') : t('openMenu')}
          className="md:hidden p-2 rounded-lg hover:bg-bg-secondary"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-border bg-white px-6 py-4 space-y-2"
        >
          <Link href="/preise" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-text-secondary">
            {t('pricing')}
          </Link>
          <Link href="/demo" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-text-secondary">
            {t('liveDemo')}
          </Link>
          <div className="pt-3 flex flex-col gap-2 border-t border-border">
            <LocaleSwitcher variant="mobile" />
            <Link href="/login" onClick={() => setOpen(false)} className="btn-secondary w-full">
              {t('signIn')}
            </Link>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="btn-primary w-full flex items-center justify-center gap-1.5"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              {tCommon('bookingCtaShort')}
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
