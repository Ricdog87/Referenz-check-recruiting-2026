'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Clock3, ArrowRight, X, Sparkles } from 'lucide-react'

export function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const urgent = daysLeft <= 3
  const tone = urgent
    ? 'from-rose-500 to-amber-500 text-white'
    : 'from-brand-500 to-violet text-white'

  return (
    <div className={`relative bg-gradient-to-r ${tone} px-4 lg:px-10 py-2.5 flex items-center justify-between gap-3 text-xs font-semibold shadow-card`}>
      <div className="flex items-center gap-2 min-w-0">
        {urgent ? <Clock3 className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" /> : <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />}
        <span className="truncate">
          {urgent
            ? `Trial endet in ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tagen'} — jetzt Plan wählen, um nahtlos weiterzuarbeiten.`
            : `Sie sind noch ${daysLeft} Tage im kostenlosen Trial. Plan jederzeit upgraden.`}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/preise"
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-colors"
        >
          Plan wählen <ArrowRight className="w-3 h-3" />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg hover:bg-white/15 transition-colors"
          aria-label="Banner schließen"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
