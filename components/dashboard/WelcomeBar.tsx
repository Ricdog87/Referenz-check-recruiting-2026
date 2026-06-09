'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Phone, Sparkles, ChevronRight } from 'lucide-react'
import { initialsOf } from '@/lib/utils'

interface WelcomeBarProps {
  firstName: string
  fullName: string
  company: string
  planName: string
  stats?: {
    totalCandidates: number
    pendingConsent: number
    inReview: number
    completed: number
  }
}

// Default-Tips (Fallback wenn keine stats vorhanden)
const DEFAULT_TIPS = [
  {
    title: 'Best Practice',
    text: '2–3 Referenzgeber pro Position liefern den aussagekräftigsten Report. Der Bewerber nennt die Personen selbst im Self-Service-Portal.',
    cta: 'Kandidat anlegen',
    href: '/candidates/new',
  },
  {
    title: 'DSGVO-Sicher',
    text: 'Alle Daten werden auf deutschen Servern gespeichert und nach Art. 32 DSGVO verschlüsselt. Audit-Trail dokumentiert jeden Zugriff.',
    cta: 'Audit-Trail ansehen',
    href: '/audit',
  },
  {
    title: 'Tipp',
    text: 'Nach Abschluss können Sie den PDF-Report direkt mit Hiring Manager und Compliance teilen — inklusive Diskrepanz-Markierung.',
    cta: 'Referenzprüfungen ansehen',
    href: '/checks',
  },
]

// Generiere persönliche Action-Tips basierend auf User-Daten
function getPersonalizedTip(stats?: WelcomeBarProps['stats']) {
  if (!stats || stats.totalCandidates === 0) {
    return {
      title: 'Erste Schritte',
      text: 'Legen Sie Ihren ersten Kandidaten an. Der Bewerber bekommt eine sichere DSGVO-konforme Einladung per E-Mail und wickelt die Einwilligung selbst ab.',
      cta: 'Ersten Kandidaten anlegen',
      href: '/candidates/new',
    }
  }
  if (stats.pendingConsent > 0) {
    return {
      title: 'Action erforderlich',
      text: `${stats.pendingConsent} Bewerber warten auf Einwilligungs-Anfrage. Senden Sie die Anfrage mit einem Klick aus dem Kandidaten-Detail.`,
      cta: 'Kandidaten ansehen',
      href: '/candidates?status=PENDING',
    }
  }
  if (stats.inReview > 0) {
    return {
      title: 'In Prüfung',
      text: `${stats.inReview} Referenz-Checks sind aktuell aktiv. Unsere Reviewer kontaktieren die freigegebenen Referenzgeber typischerweise innerhalb von 48 Stunden.`,
      cta: 'Prüfungen ansehen',
      href: '/checks',
    }
  }
  // Wenn alles ruhig: random default tip
  return DEFAULT_TIPS[Math.floor(Math.random() * DEFAULT_TIPS.length)]
}

export function WelcomeBar({ firstName, fullName, company, planName, stats }: WelcomeBarProps) {
  const [greeting, setGreeting] = useState('Guten Tag')
  const tip = getPersonalizedTip(stats)

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 11) setGreeting('Guten Morgen')
    else if (h < 14) setGreeting('Guten Mittag')
    else if (h < 18) setGreeting('Guten Tag')
    else setGreeting('Guten Abend')
  }, [])

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
