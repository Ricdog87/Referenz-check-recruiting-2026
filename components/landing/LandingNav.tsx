'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Zap } from 'lucide-react'

export function LandingNav() {
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
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-2xl overflow-hidden flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)',
              boxShadow: '0 6px 20px rgba(79,70,229,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}>
            <span className="text-white text-sm font-black tracking-tighter">CQ</span>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
          </div>
          <span className="text-base font-bold text-text-primary tracking-tight">candiq</span>
          <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-widest text-brand-600 px-1.5 py-0.5 rounded-md bg-brand-50 border border-brand-100 ml-1">Pro</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="#wie-es-funktioniert" className="text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-2 rounded-lg transition-colors">So funktioniert&rsquo;s</Link>
          <Link href="#zielgruppen" className="text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-2 rounded-lg transition-colors">Für wen</Link>
          <Link href="#features" className="text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-2 rounded-lg transition-colors">Features</Link>
          <Link href="/waitlist-agency" className="text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-2 rounded-lg transition-colors">PDL-Warteliste</Link>
          <Link href="/preise" className="text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-2 rounded-lg transition-colors">Preise</Link>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/demo" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 px-3 py-2 rounded-full transition-colors hover:bg-brand-50">
            <Zap className="w-3.5 h-3.5" />
            Live-Demo
          </Link>
          <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary px-4 py-2 rounded-full transition-colors">
            Anmelden
          </Link>
          <Link href="/register" className="btn-primary text-xs py-2 px-4">
            Kostenlos starten
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-bg-secondary">
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
          <Link href="#wie-es-funktioniert" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-text-secondary">So funktioniert&rsquo;s</Link>
          <Link href="#zielgruppen" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-text-secondary">Für wen</Link>
          <Link href="#features" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-text-secondary">Features</Link>
          <Link href="/waitlist-agency" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-text-secondary">PDL-Warteliste</Link>
          <Link href="/preise" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-text-secondary">Preise</Link>
          <div className="pt-3 flex flex-col gap-2 border-t border-border">
            <Link href="/demo" onClick={() => setOpen(false)} className="btn-secondary w-full flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-600" />Live-Demo
            </Link>
            <Link href="/login" onClick={() => setOpen(false)} className="btn-secondary w-full">Anmelden</Link>
            <Link href="/register" onClick={() => setOpen(false)} className="btn-primary w-full">Kostenlos starten</Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
