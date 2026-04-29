'use client'

import Link from 'next/link'
import { Sparkles, Search } from 'lucide-react'
import { ACCOUNT_TYPES, getPlanById } from '@/lib/utils'

interface TopBarProps {
  name: string
  company: string
  accountType: string
  plan: string
}

export function TopBar({ name, company, accountType, plan }: TopBarProps) {
  const accountMeta = ACCOUNT_TYPES[accountType as keyof typeof ACCOUNT_TYPES]
  const planMeta = getPlanById(plan)

  return (
    <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-border">
      <div className="h-16 flex items-center justify-between gap-4 px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="text-sm text-text-muted">{company}</div>
          <span className="badge-brand text-[10px]">
            {accountMeta?.short ?? 'HR'}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-bg-secondary border border-border text-text-secondary">
            {planMeta.name}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="search"
              placeholder="Suche Kandidaten, Prüfungen…"
              className="w-full pl-10 pr-4 py-2 text-sm rounded-full bg-bg-secondary border border-border focus:bg-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/15 transition-all"
            />
          </div>
        </div>

        <Link
          href="/preise"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 px-3 py-1.5 rounded-full bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" /> Upgrade
        </Link>
      </div>
    </div>
  )
}
