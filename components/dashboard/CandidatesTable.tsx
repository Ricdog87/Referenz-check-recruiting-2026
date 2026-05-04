'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Search, Filter, SortAsc, SortDesc, Users, Plus, ShieldCheck, ShieldAlert, ChevronRight } from 'lucide-react'
import { CANDIDATE_STATUS } from '@/lib/utils'

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string | null
  position: string | null
  department: string | null
  status: string
  gdprConsent: boolean
  createdAt: Date
  _count: { checks: number; documents: number }
}

interface StatusCount { status: string; _count: number }

interface CandidatesTableProps {
  candidates: Candidate[]
  statusCounts: StatusCount[]
  total: number
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function CandidatesTable({ candidates, statusCounts, total }: CandidatesTableProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [sortField, setSortField] = useState<'name' | 'date' | 'checks'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [view, setView] = useState<'table' | 'grid'>('table')

  const filtered = useMemo(() => {
    let list = [...candidates]
    if (filter) list = list.filter(c => c.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.position ?? '').toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      let val = 0
      if (sortField === 'name') val = `${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`)
      else if (sortField === 'date') val = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      else if (sortField === 'checks') val = a._count.checks - b._count.checks
      return sortDir === 'asc' ? val : -val
    })
    return list
  }, [candidates, filter, search, sortField, sortDir])

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const SortIcon = sortDir === 'asc' ? SortAsc : SortDesc

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Name, E-Mail, Position…"
            className="w-full pl-8 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all"
          />
        </div>

        {/* Status filters */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { label: 'Alle', value: '' },
            ...Object.entries(CANDIDATE_STATUS).map(([k, v]) => ({ label: v.label, value: k })),
          ].map(f => {
            const active = filter === f.value
            const count = f.value ? (statusCounts.find(s => s.status === f.value)?._count ?? 0) : total
            return (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'
                }`}>
                {f.label}
                <span className={`px-1.5 rounded-md text-[9px] font-bold ${active ? 'bg-white/25 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Sort + view */}
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => toggleSort('name')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortField === 'name' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <SortIcon className="w-3 h-3" /> Name
          </button>
          <button onClick={() => toggleSort('date')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortField === 'date' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            Datum
          </button>
          <div className="flex rounded-lg overflow-hidden border border-slate-200">
            {(['table', 'grid'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${view === v ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                {v === 'table' ? '☰' : '⊞'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          <span className="font-semibold text-slate-700">{filtered.length}</span> Kandidaten angezeigt
          {search && <span className="ml-1">für „{search}"</span>}
        </p>
        <Link href="/candidates/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5" /> Kandidat hinzufügen
        </Link>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
          <div className="w-14 h-14 rounded-2xl bg-slate-50 mx-auto mb-4 flex items-center justify-center">
            <Users className="w-6 h-6 text-slate-300" />
          </div>
          <div className="text-sm font-semibold text-slate-700 mb-1">Keine Kandidaten gefunden</div>
          <div className="text-xs text-slate-400 mb-6">
            {search || filter ? 'Andere Filter oder Suchbegriffe versuchen.' : 'Legen Sie Ihren ersten Kandidaten an.'}
          </div>
          {!search && !filter && (
            <Link href="/candidates/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Ersten Kandidaten anlegen
            </Link>
          )}
        </div>
      )}

      {/* Table view */}
      {view === 'table' && filtered.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kandidat</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Position</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Prüfungen</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">DSGVO</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Angelegt</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c) => {
                  const st = CANDIDATE_STATUS[c.status as keyof typeof CANDIDATE_STATUS] ?? CANDIDATE_STATUS.PENDING
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-3.5">
                        <Link href={`/candidates/${c.id}`} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-700">
                            {c.firstName[0]}{c.lastName[0]}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                              {c.firstName} {c.lastName}
                            </div>
                            {c.email && <div className="text-xs text-slate-400">{c.email}</div>}
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="text-xs text-slate-700">{c.position}</div>
                        {c.department && <div className="text-[10px] text-slate-400">{c.department}</div>}
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-sm font-bold tabular-nums text-slate-700">{c._count.checks}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {c.gdprConsent
                          ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><ShieldCheck className="w-3 h-3" /> Erteilt</span>
                          : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full"><ShieldAlert className="w-3 h-3" /> Ausstehend</span>}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">{formatDate(c.createdAt)}</td>
                      <td className="px-3 py-3.5">
                        <Link href={`/candidates/${c.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => {
            const st = CANDIDATE_STATUS[c.status as keyof typeof CANDIDATE_STATUS] ?? CANDIDATE_STATUS.PENDING
            return (
              <Link key={c.id} href={`/candidates/${c.id}`}
                className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">{c.firstName} {c.lastName}</div>
                    <div className="text-xs text-slate-400 truncate">{c.position}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.color}`}>{st.label}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{c._count.checks} Prüfung{c._count.checks !== 1 ? 'en' : ''}</span>
                    {c.gdprConsent
                      ? <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      : <ShieldAlert className="w-3 h-3 text-amber-400" />}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
