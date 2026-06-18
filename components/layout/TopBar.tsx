'use client'

import Link from 'next/link'
import { Sparkles, Search, Menu } from 'lucide-react'
import { ACCOUNT_TYPES, getPlanById } from '@/lib/utils'
import { useMobileSidebar } from './MobileSidebarContext'

interface TopBarProps {
  name: string
  company: string
  accountType: string
  plan: string
  role?: string
}

export function TopBar({ name, company, accountType, plan, role }: TopBarProps) {
  const { toggle } = useMobileSidebar()
  const accountMeta = ACCOUNT_TYPES[accountType as keyof typeof ACCOUNT_TYPES]
  const planMeta = getPlanById(plan)
  const isInternal = role === 'ADMIN' || role === 'REVIEWER'

  return (
    <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-border">
      <div className="h-16 flex items-center justify-between gap-4 px-4 lg:px-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggle}
            className="lg:hidden p-2 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
            aria-label="Menü öffnen"
          >
            <Menu className="w-5 h-5" />
          </button>
          {isInternal ? (
            <>
              <div className="text-sm font-semibold text-text-primary truncate hidden sm:block">
                candiq · {role === 'ADMIN' ? 'Admin-Cockpit' : 'Reviewer-Cockpit'}
              </div>
              <span
                className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  role === 'ADMIN'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-brand-50 text-brand-700 border border-brand-200'
                }`}
              >
                {role}
              </span>
            </>
          ) : (
            <>
              <div className="text-sm text-text-secondary truncate hidden sm:block">{company}</div>
              <span className="hidden sm:inline-flex badge-brand text-[10px]">
                {accountMeta?.short ?? 'HR'}
              </span>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-bg-secondary border border-border text-text-secondary">
                {planMeta.name}
              </span>
            </>
          )}
        </div>

        {/* Suchleiste nur fuer Kunden — interne Cockpits haben eigene Listen-Filter */}
        {!isInternal && (
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
        )}

        {/* Upgrade-CTA nur fuer Kunden. ADMIN/REVIEWER haben keinen Plan. */}
        {!isInternal && (
          <Link
            href="/preise"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 px-3 py-1.5 rounded-full bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" /> Upgrade
          </Link>
        )}
      </div>
    </div>
  )
}
