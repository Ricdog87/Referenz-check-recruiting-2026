'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Phone, Sparkles, Clock3, ChevronRight } from 'lucide-react'
import { initialsOf } from '@/lib/utils'

interface WelcomeBarProps {
  firstName: string
  fullName: string
  company: string
  planName: string
  trialDaysLeft: number | null
  isTrialing: boolean
}

const TIPS = [
  {
    title: 'Schon gewusst?',
    text: 'candiq Interview ist jetzt verfügbar — strukturierte Kompetenz-Interviews mit Scorecard, ab €199 pro Kandidat.',
    cta: 'Interview buchen',
    href: '/addons',
  },
  {
    title: 'Tipp',
    text: 'Sie können bis zu 3 frühere Arbeitgeber pro Kandidat anlegen. Mehr Datenpunkte = aussagekräftigerer Report.',
    cta: 'Kandidat anlegen',
    href: '/candidates/new',
  },
  {
    title: 'Express',
    text: 'Brauchen Sie eine Verifizierung in unter 24 h? Buchen Sie Express-Bearbeitung als Add-on (€29 Aufpreis).',
    cta: 'Express aktivieren',
    href: '/addons',
  },
  {
    title: 'Compliance',
    text: 'Alle Reports werden auf deutschen Servern gespeichert und nach DSGVO Art. 32 verschlüsselt — auditierbar auf Knopfdruck.',
    cta: 'Audit-Trail ansehen',
    href: '/settings',
  },
]

export function WelcomeBar({ firstName, fullName, company, planName, trialDaysLeft, isTrialing }: WelcomeBarProps) {
  const [greeting, setGreeting] = useState('Guten Tag')
  const [tip, setTip] = useState(TIPS[0])

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 11) setGreeting('Guten Morgen')
    else if (h < 14) setGreeting('Guten Mittag')
    else if (h < 18) setGreeting('Guten Tag')
    else setGreeting('Guten Abend')

    // Pick a random tip on first paint, stable per session
    setTip(TIPS[Math.floor(Math.random() * TIPS.length)])
  }, [])

  const showTrial = isTrialing && trialDaysLeft !== null && trialDaysLeft > 0
  const trialUrgent = showTrial && (trialDaysLeft as number) <= 3

  return (
    <section className="relative overflow-hidden rounded-3xl mb-6 p-6 lg:p-8 bg-gradient-to-br from-brand-600 via-brand-700 to-violet text-white shadow-card-xl">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan/20 blur-3xl pointer-events-none" />

      <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        {/* Greeting + actions */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-base font-bold tracking-tighter">
              {initialsOf(company)}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-white/70">{company}</div>
              <div className="text-[11px] text-white/60 flex items-center gap-2">
                <span>{planName} Plan</span>
                {showTrial && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    <span className={trialUrgent ? 'font-bold text-amber-200' : 'text-white/70'}>
                      <Clock3 className="w-3 h-3 inline mr-0.5" />
                      {trialDaysLeft} Tage Trial
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <h1 className="text-3xl lg:text-[40px] font-black tracking-tightest leading-[1.05] mb-3">
            {greeting}, {firstName}.
          </h1>
          <p className="text-base text-white/85 max-w-xl leading-relaxed mb-6">
            Hier ist Ihr <span className="font-semibold text-white">Live-Überblick</span> — alle laufenden
            Reference-Checks, das Pipeline-Health und gebuchte Add-ons auf einen Blick.
          </p>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/candidates/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-white text-brand-700 hover:bg-bg-secondary shadow-card transition-all"
            >
              <Plus className="w-4 h-4" /> Kandidat hinzufügen
            </Link>
            <Link
              href="/checks/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white transition-all"
            >
              <Phone className="w-4 h-4" /> Neue Prüfung starten
            </Link>
            <Link
              href="/addons"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-amber-300/95 hover:bg-amber-300 text-amber-900 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Add-ons buchen
            </Link>
          </div>
        </div>

        {/* Tip card */}
        <div className="rounded-2xl p-5 bg-white/10 backdrop-blur-md border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/80">{tip?.title ?? 'Tipp'}</div>
          </div>
          <p className="text-sm text-white/90 leading-relaxed mb-4">{tip?.text}</p>
          <Link
            href={tip?.href ?? '/addons'}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-200 hover:text-amber-100 group"
          >
            {tip?.cta ?? 'Mehr erfahren'}
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
