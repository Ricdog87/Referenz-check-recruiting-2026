'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, Play, Clock3, FileCheck2, BadgeCheck, CalendarCheck } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { Hero3D } from '../landing/Hero3D'
import { BOOKING_URL } from '@/lib/site'

export function HeroI18n() {
  const t = useTranslations('landing.hero')
  const tCommon = useTranslations('common')
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const blobY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60])
  const fadeOut = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const pills = [
    { icon: Clock3, k: t('pills.speed.title'), v: t('pills.speed.subtitle') },
    { icon: FileCheck2, k: t('pills.report.title'), v: t('pills.report.subtitle') },
    { icon: BadgeCheck, k: t('pills.human.title'), v: t('pills.human.subtitle') },
  ]

  return (
    <section ref={ref} className="relative pt-28 pb-24 lg:pb-32 px-6 overflow-hidden">
      <motion.div style={{ y: blobY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-[600px] h-[600px] rounded-full opacity-40 animate-blob"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.45), transparent 60%)', filter: 'blur(60px)' }} />
        <div className="absolute top-32 right-1/4 w-[500px] h-[500px] rounded-full opacity-30 animate-blob"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.45), transparent 60%)', filter: 'blur(60px)', animationDelay: '4s' }} />
        <div className="absolute -bottom-20 left-1/2 w-[700px] h-[400px] rounded-full opacity-25 animate-blob"
          style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.4), transparent 60%)', filter: 'blur(60px)', animationDelay: '8s' }} />
      </motion.div>

      <div className="absolute inset-0 grid-bg grid-bg-mask opacity-60 pointer-events-none" />

      <motion.div style={{ opacity: fadeOut }} className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
        <motion.div style={{ y: textY }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-7 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-brand-200 shadow-card"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600" />
            </span>
            <span className="text-text-primary">{t('badge')}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[clamp(40px,6.5vw,72px)] font-bold leading-[1.02] tracking-tightest mb-6 text-text-primary"
          >
            <span className="block">{t('headline1')}</span>
            <span className="block">{t('headline2')}</span>
            <span className="block"><span className="text-gradient-brand">{t('headline3')}</span></span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-lg text-text-secondary leading-relaxed max-w-xl mb-9"
          >
            {t('subtitlePart1')}
            <span className="font-semibold text-text-primary">{t('subtitleBrand')}</span>
            {t('subtitlePart2')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 mb-6"
          >
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn-primary text-base py-3.5 px-7 group">
              <CalendarCheck className="w-4 h-4" />
              {tCommon('bookingCta')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <Link href="/demo" className="btn-secondary text-base py-3.5 px-7">
              <Play className="w-4 h-4 text-brand-600" />
              {tCommon('demoCta')}
            </Link>
          </motion.div>

          <div className="text-xs text-text-muted mb-10">
            {t('microcopy')}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 pt-8 border-t border-border"
          >
            {pills.map(({ icon: Icon, k, v }) => (
              <div key={k} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">{k}</div>
                  <div className="text-xs text-text-muted leading-snug">{v}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:block"
        >
          <Hero3D />
        </motion.div>
      </motion.div>
    </section>
  )
}
