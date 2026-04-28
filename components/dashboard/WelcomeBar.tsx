'use client'

import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Guten Morgen'
  if (h < 17) return 'Guten Tag'
  return 'Guten Abend'
}

export function WelcomeBar({ name, company }: { name: string; company: string }) {
  const firstName = useMemo(() => (name?.split(' ')[0] || 'Team'), [name])
  return (
    <div className="card-md bg-gradient-to-br from-brand-50/70 to-violet/10 border-brand-100">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-text-primary">{getGreeting()}, {firstName} 👋</div>
          <div className="text-xs text-text-secondary mt-1">
            Willkommen im candiq Workspace von <span className="font-semibold text-text-primary">{company}</span>.
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-brand-200 text-[11px] font-semibold text-brand-700">
          <Sparkles className="w-3.5 h-3.5" /> Smart Workspace
        </div>
      </div>
    </div>
  )
}
