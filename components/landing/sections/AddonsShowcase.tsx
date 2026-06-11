'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarCheck, Sparkles, CheckCircle2 } from 'lucide-react'
import { ADDONS, formatEuro, type Addon } from '@/lib/addons'
import { Reveal } from '../Reveal'
import { BOOKING_URL } from '@/lib/site'

const COLOR_GRADIENTS: Record<Addon['color'], { card: string; pill: string; iconBg: string; iconText: string }> = {
  brand: {
    card: 'from-brand-50 to-white border-brand-200',
    pill: 'bg-brand-100 text-brand-800',
    iconBg: 'bg-brand-100',
    iconText: 'text-brand-700',
  },
  violet: {
    card: 'from-violet/5 to-white border-violet/20',
    pill: 'bg-violet/10 text-violet',
    iconBg: 'bg-violet/10',
    iconText: 'text-violet',
  },
  amber: {
    card: 'from-amber-50 to-white border-amber-200',
    pill: 'bg-amber-100 text-amber-800',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-700',
  },
  emerald: {
    card: 'from-emerald-50 to-white border-emerald-200',
    pill: 'bg-emerald-100 text-emerald-800',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-700',
  },
  cyan: {
    card: 'from-cyan-50 to-white border-cyan-200',
    pill: 'bg-cyan-100 text-cyan-800',
    iconBg: 'bg-cyan-100',
    iconText: 'text-cyan-700',
  },
  rose: {
    card: 'from-rose-50 to-white border-rose-200',
    pill: 'bg-rose-100 text-rose-800',
    iconBg: 'bg-rose-100',
    iconText: 'text-rose-700',
  },
}

function findAddon(sku: string): Addon | undefined {
  return ADDONS.find((a) => a.sku === sku)
}

export function AddonsShowcase() {
  const premium = findAddon('INTERVIEW')!
  const serviceCards = (['PRE_SCREENING_CALL', 'DOCUMENT_VERIFICATION', 'CV_SCREENING'] as const)
    .map(findAddon)
    .filter((a): a is Addon => Boolean(a))
  const volumeCards = (['CHECK_PACK_5', 'CHECK_PACK_10', 'EXPRESS_24H'] as const)
    .map(findAddon)
    .filter((a): a is Addon => Boolean(a))

  return (
    <section id="addons" className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.12), transparent 65%)', filter: 'blur(80px)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Recruiting-Services & Add-ons
            </div>
            <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tighter mb-5 text-text-primary leading-[1.1]">
              Über die Referenzprüfung hinaus.
              <br />
              <span className="text-gradient-brand">Mehr Tiefe, wenn Sie sie brauchen.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Buchbar pro Kandidat oder im Bundle — von der Telefonvorklärung bis zum strukturierten
              Senior-Interview. Alle Services AGG- und DSGVO-konform, durchgeführt von geschulten Recruitern.
            </p>
          </div>
        </Reveal>

        {/* PREMIUM HERO: candiq Deep-Check */}
        <Reveal>
          <PremiumCard addon={premium} />
        </Reveal>

        {/* SERVICE GRID */}
        <Reveal>
          <div className="mt-14 mb-4">
            <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              Vor & während des Recruiting-Prozesses
            </div>
            <div className="text-base text-text-secondary">
              Punktuelle Services, die Sie pro Kandidat oder im Bundle buchen.
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {serviceCards.map((addon) => (
              <ServiceCard key={addon.sku} addon={addon} />
            ))}
          </div>
        </Reveal>

        {/* VOLUME / SPEED GRID */}
        <Reveal>
          <div className="mt-14 mb-4">
            <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              Volumen & Geschwindigkeit
            </div>
            <div className="text-base text-text-secondary">
              Pakete für High-Volume-Recruiting und Express-SLAs.
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {volumeCards.map((addon) => (
              <ServiceCard key={addon.sku} addon={addon} />
            ))}
          </div>
        </Reveal>

        {/* Bundle hint */}
        <Reveal>
          <div className="mt-12 card-md flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <div className="font-semibold text-text-primary mb-0.5">Bundle-Rabatte bei Kombination</div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Pre-Screening + Reference-Check + Deep-Check als 360°-Paket buchen — bis zu 25 % Rabatt im Bundle.
                  Wir konfigurieren Ihr Volumen-Setup im 15-Min-Termin.
                </p>
              </div>
            </div>
            <Link
              href={BOOKING_URL}
              className="btn-primary whitespace-nowrap"
            >
              <CalendarCheck className="w-4 h-4" />
              Bundle besprechen
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function PremiumCard({ addon }: { addon: Addon }) {
  const Icon = addon.icon
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-700 via-violet to-amber-500 text-white shadow-float"
    >
      {/* Decorative orbs */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(ellipse, #fbbf24, transparent 60%)' }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(ellipse, #06b6d4, transparent 60%)' }}
      />

      <div className="relative grid md:grid-cols-[1.3fr_1fr] gap-8 p-8 md:p-12 items-center">
        {/* Left: Headline + features */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/15 border border-white/20 backdrop-blur-md mb-5">
            <Sparkles className="w-3 h-3 text-amber-200" />
            {addon.badge ?? 'Premium-Service'}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-glow">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-3xl md:text-4xl font-black tracking-tightest">{addon.name}</h3>
          </div>

          <p className="text-base md:text-lg text-white/90 leading-relaxed mb-6 max-w-2xl">
            {addon.description}
          </p>

          <ul className="grid sm:grid-cols-2 gap-2.5 mb-7">
            {addon.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-white/95">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-200" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={BOOKING_URL}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-base font-bold bg-white text-brand-700 hover:bg-bg-secondary shadow-card transition-all"
            >
              <CalendarCheck className="w-4 h-4" />
              Termin für Deep-Check buchen
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#addons"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white transition-all"
            >
              Mehr erfahren
            </a>
          </div>
        </div>

        {/* Right: Price */}
        <div className="md:pl-6 md:border-l border-white/15">
          <div className="text-xs uppercase tracking-widest text-white/70 font-bold mb-2">
            Investment
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-6xl md:text-7xl font-black tracking-tightest" style={{ fontFeatureSettings: '"tnum"' }}>
              {addon.price}
            </span>
            <span className="text-2xl font-bold text-white/80">€</span>
          </div>
          <div className="text-sm text-white/80 mb-6">
            pro {addon.unit} · zzgl. USt.
          </div>

          <div className="space-y-2 text-sm text-white/85">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-200" />
              <span>Bundle mit Reference-Check: <strong className="text-white">−15 %</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-200" />
              <span>5er-Volumen-Paket: ab <strong className="text-white">1.490 €</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-200" />
              <span>Enterprise-Flatrate: <strong className="text-white">auf Anfrage</strong></span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ServiceCard({ addon }: { addon: Addon }) {
  const Icon = addon.icon
  const palette = COLOR_GRADIENTS[addon.color]

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className={`relative h-full rounded-2xl border bg-gradient-to-br ${palette.card} p-6 shadow-card hover:shadow-card-xl transition-shadow flex flex-col`}
    >
      {addon.badge && (
        <div
          className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${palette.pill}`}
        >
          {addon.badge}
        </div>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div className={`w-11 h-11 rounded-xl ${palette.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${palette.iconText}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-text-primary tracking-tight leading-tight">
            {addon.name}
          </div>
          <div className="text-xs text-text-muted mt-0.5 leading-snug">{addon.tagline}</div>
        </div>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed mb-5 flex-1">{addon.description}</p>

      <ul className="space-y-2 mb-5">
        {addon.features.slice(0, 4).map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
            <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${palette.iconText}`} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4 border-t border-border flex items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1">
            <span
              className="text-3xl font-black text-text-primary tracking-tighter"
              style={{ fontFeatureSettings: '"tnum"' }}
            >
              {addon.price}
            </span>
            <span className="text-base font-semibold text-text-muted">€</span>
          </div>
          {addon.fromPrice && addon.fromPrice > addon.price && (
            <div className="text-[11px] text-text-muted line-through">
              statt {formatEuro(addon.fromPrice)}
            </div>
          )}
          <div className="text-[11px] text-text-muted">pro {addon.unit}</div>
        </div>
        <Link
          href={BOOKING_URL}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold btn-primary whitespace-nowrap"
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          Buchen
        </Link>
      </div>
    </motion.div>
  )
}
