'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Zap, CalendarCheck } from 'lucide-react'
import { BOOKING_URL } from '@/lib/site'
import { LocaleSwitcher } from '@/components/locale-switcher/LocaleSwitcher'

/**
 * English-language nav for /en. Same chrome as German nav, English labels.
 * Interior links pointing to non-translated routes (/preise, /demo, etc.) lead
 * to the existing German pages — that's the bridge until full EN-section
 * coverage. Acceptable for an MVP English landing.
 */
export function LandingNavEn() {
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
        <Link href="/en" className="flex items-center gap-2 group" aria-label="candiq home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="candiq" width={120} height={32} className="h-8 w-auto" />
          <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-widest text-brand-600 px-1.5 py-0.5 rounded-md bg-brand-50 border border-brand-100 ml-1">
            Pro
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link href="/preise" className="text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-2 rounded-lg transition-colors">
            Pricing
          </Link>
          <Link href="/termin" className="text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-2 rounded-lg transition-colors">
            Live demo
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <LocaleSwitcher />
          <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary px-4 py-2 rounded-full transition-colors">
            Sign in
          </Link>
          <a
            href={BOOKING_URL}
            className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Book a call
          </a>
        </div>

        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="md:hidden p-2 rounded-lg hover:bg-bg-secondary"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-border bg-white px-6 py-4 space-y-2"
        >
          <Link href="/preise" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-text-secondary">
            Pricing
          </Link>
          <Link href="/termin" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-text-secondary">
            Live demo
          </Link>
          <div className="pt-3 flex flex-col gap-2 border-t border-border">
            <Link href="/" onClick={() => setOpen(false)} className="block py-2 text-xs font-semibold text-text-muted">
              Deutsche Version
            </Link>
            <Link href="/login" onClick={() => setOpen(false)} className="btn-secondary w-full">
              Sign in
            </Link>
            <a
              href={BOOKING_URL}
              onClick={() => setOpen(false)}
              className="btn-primary w-full flex items-center justify-center gap-1.5"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              Book a call
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
