'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Sparkles, Search, Menu, Users, ClipboardList, Loader2, X } from 'lucide-react'
import { ACCOUNT_TYPES, getPlanById, CANDIDATE_STATUS, CHECK_STATUS } from '@/lib/utils'
import { useMobileSidebar } from './MobileSidebarContext'

interface TopBarProps {
  name: string
  company: string
  accountType: string
  plan: string
}

type SearchResult = {
  candidates: Array<{ id: string; firstName: string; lastName: string; position: string; status: string }>
  checks: Array<{
    id: string
    employerName: string
    position: string | null
    status: string
    result: string | null
    candidate: { firstName: string; lastName: string }
  }>
}

export function TopBar({ name, company, accountType, plan }: TopBarProps) {
  const { toggle } = useMobileSidebar()
  const router = useRouter()
  const accountMeta = ACCOUNT_TYPES[accountType as keyof typeof ACCOUNT_TYPES]
  const planMeta = getPlanById(plan)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced fetch
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null)
      setLoading(false)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { cache: 'no-store' })
        if (res.ok) {
          setResults(await res.json())
        }
      } catch {
        /* fail silently — search is non-critical */
      } finally {
        setLoading(false)
      }
    }, 220)
    return () => clearTimeout(timer)
  }, [query])

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Cmd/Ctrl + K to focus
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const total = (results?.candidates.length ?? 0) + (results?.checks.length ?? 0)
  const showDropdown = open && query.trim().length >= 2

  function navigate(href: string) {
    setOpen(false)
    setQuery('')
    setResults(null)
    router.push(href)
  }

  return (
    <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-border">
      <div className="h-16 flex items-center justify-between gap-3 px-4 lg:px-10">
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
          <button
            onClick={toggle}
            className="lg:hidden p-2 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
            aria-label="Menü öffnen"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm text-text-secondary truncate hidden lg:block">{company}</div>
          <span className="hidden lg:inline-flex badge-brand text-[10px]">
            {accountMeta?.short ?? 'HR'}
          </span>
          <span className="hidden xl:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-bg-secondary border border-border text-text-secondary">
            {planMeta.name}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md mx-auto" ref={wrapRef}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder="Suchen…"
              className="w-full pl-10 pr-9 py-2 text-sm rounded-full bg-bg-secondary border border-border focus:bg-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/15 transition-all"
              aria-label="Globale Suche"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-muted hover:text-text-primary"
                aria-label="Suche leeren"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-2xl shadow-card-lg overflow-hidden max-h-[480px] overflow-y-auto">
                {loading && total === 0 && (
                  <div className="px-4 py-6 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Suche…
                  </div>
                )}
                {!loading && results && total === 0 && (
                  <div className="px-4 py-6 text-center text-xs text-text-muted">
                    Nichts gefunden für „<span className="font-semibold text-text-secondary">{query}</span>".
                  </div>
                )}
                {results && results.candidates.length > 0 && (
                  <div className="border-b border-border">
                    <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      Kandidaten ({results.candidates.length})
                    </div>
                    {results.candidates.map((c) => {
                      const st = CANDIDATE_STATUS[c.status as keyof typeof CANDIDATE_STATUS] ?? CANDIDATE_STATUS.PENDING
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => navigate(`/candidates/${c.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-secondary transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-violet/20 border border-brand-200 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-brand-700">
                            {c.firstName[0]}{c.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-text-primary truncate">{c.firstName} {c.lastName}</div>
                            <div className="text-[10px] text-text-muted truncate">{c.position}</div>
                          </div>
                          <span className={`badge ${st.color} text-[10px] flex-shrink-0`}>{st.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {results && results.checks.length > 0 && (
                  <div>
                    <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      Prüfungen ({results.checks.length})
                    </div>
                    {results.checks.map((chk) => {
                      const st = CHECK_STATUS[chk.status as keyof typeof CHECK_STATUS] ?? CHECK_STATUS.OPEN
                      return (
                        <button
                          key={chk.id}
                          type="button"
                          onClick={() => navigate(`/checks/${chk.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-secondary transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-bg-secondary border border-border flex items-center justify-center flex-shrink-0 text-text-muted">
                            <ClipboardList className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-text-primary truncate">{chk.employerName}</div>
                            <div className="text-[10px] text-text-muted truncate">
                              {chk.candidate.firstName} {chk.candidate.lastName}
                              {chk.position && <> · {chk.position}</>}
                            </div>
                          </div>
                          <span className={`badge ${st.color} text-[10px] flex-shrink-0`}>{st.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {results && total > 0 && (
                  <div className="border-t border-border bg-bg-secondary/50">
                    <button
                      type="button"
                      onClick={() => navigate(`/candidates?q=${encodeURIComponent(query.trim())}`)}
                      className="w-full px-4 py-2 text-[11px] text-brand-700 hover:text-brand-800 font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Users className="w-3 h-3" /> Alle Kandidaten-Treffer ansehen →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Link
          href="/preise"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 px-3 py-1.5 rounded-full bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors flex-shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" /> Upgrade
        </Link>
      </div>
    </div>
  )
}
