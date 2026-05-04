'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, Search, Menu, Bell, ChevronDown } from 'lucide-react'
import { ACCOUNT_TYPES, getPlanById } from '@/lib/utils'
import { useMobileSidebar } from './MobileSidebarContext'
import { useState, useRef, useEffect } from 'react'

interface TopBarProps {
  name: string
  company: string
  accountType: string
  plan: string
}

export function TopBar({ name, company, accountType, plan }: TopBarProps) {
  const { toggle } = useMobileSidebar()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(false)
  const accountMeta = ACCOUNT_TYPES[accountType as keyof typeof ACCOUNT_TYPES]
  const planMeta = getPlanById(plan)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) router.push(`/candidates?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="h-[60px] flex items-center justify-between gap-4 px-4 lg:px-6">
        {/* Left: hamburger + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggle}
            className="lg:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">{company}</span>
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-indigo-50 text-indigo-700">{accountMeta?.short ?? 'HR'}</span>
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-slate-100 text-slate-500">{planMeta.name}</span>
          </div>
        </div>

        {/* Center: global search */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-sm mx-auto">
          <div className={`relative w-full transition-all duration-200 ${focused ? 'scale-105' : ''}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Kandidaten, Prüfungen suchen…"
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all"
            />
            {search && (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-100 text-slate-400 border border-slate-200">↵</kbd>
            )}
          </div>
        </form>

        {/* Right: upgrade CTA */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/preise"
            className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors">
            <Sparkles className="w-3 h-3" /> Upgrade
          </Link>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
            {name?.[0]?.toUpperCase() ?? '?'}
          </div>
        </div>
      </div>
    </div>
  )
}
