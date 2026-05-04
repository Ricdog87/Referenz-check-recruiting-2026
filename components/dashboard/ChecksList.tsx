'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Search, Plus, Phone, CheckCircle2, AlertCircle, Clock, XCircle, ChevronRight, Filter } from 'lucide-react'
import { CHECK_STATUS, CHECK_RESULT } from '@/lib/utils'

interface Check {
  id: string
  employerName: string
  employerContact: string | null
  status: string
  result: string | null
  rating: number | null
  createdAt: Date
  updatedAt: Date
  candidate: { id: string; firstName: string; lastName: string; position: string | null }
}

interface StatusCount { status: string; _count: number }

interface ChecksListProps {
  checks: Check[]
  statusCounts: StatusCount[]
  total: number
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    OPEN: 'bg-amber-400',
    IN_PROGRESS: 'bg-indigo-500',
    COMPLETED: 'bg-emerald-500',
    CANCELLED: 'bg-slate-300',
  }
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${map[status] ?? 'bg-slate-300'}`} />
}

function ResultIcon({ result }: { result: string | null }) {
  if (result === 'VERIFIED') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
  if (result === 'DISCREPANCY_FOUND') return <AlertCircle className="w-4 h-4 text-rose-500" />
  if (result === 'UNREACHABLE') return <XCircle className="w-4 h-4 text-slate-400" />
  return <Clock className="w-4 h-4 text-amber-400" />
}

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <div key={i} className={`w-2 h-2 rounded-full ${i <= rating ? 'bg-amber-400' : 'bg-slate-200'}`} />
      ))}
    </div>
  )
}

export function ChecksList({ checks, statusCounts, total }: ChecksListProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    let list = [...checks]
    if (filter) list = list.filter(c => c.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.employerName.toLowerCase().includes(q) ||
        `${c.candidate.firstName} ${c.candidate.lastName}`.toLowerCase().includes(q) ||
        (c.candidate.position ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [checks, filter, search])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Unternehmen oder Kandidat…"
            className="w-full pl-8 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { label: 'Alle', value: '' },
            ...Object.entries(CHECK_STATUS).map(([k, v]) => ({ label: v.label, value: k })),
          ].map(f => {
            const active = filter === f.value
            const count = f.value ? (statusCounts.find(s => s.status === f.value)?._count ?? 0) : total
            return (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}>
                {f.label}
                <span className={`px-1.5 rounded-md text-[9px] font-bold ${active ? 'bg-white/25 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{count}</span>
              </button>
            )
          })}
        </div>
        <div className="ml-auto">
          <Link href="/checks/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Neue Prüfung
          </Link>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        <span className="font-semibold text-slate-700">{filtered.length}</span> Prüfungen
        {search && <span className="ml-1">für „{search}"</span>}
      </p>

      {filtered.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
          <div className="w-14 h-14 rounded-2xl bg-slate-50 mx-auto mb-4 flex items-center justify-center">
            <Phone className="w-6 h-6 text-slate-300" />
          </div>
          <div className="text-sm font-semibold text-slate-700 mb-1">Keine Prüfungen gefunden</div>
          <div className="text-xs text-slate-400 mb-6">
            {search || filter ? 'Andere Filter versuchen.' : 'Starten Sie Ihre erste Referenzprüfung.'}
          </div>
          {!search && !filter && (
            <Link href="/candidates/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Kandidat anlegen
            </Link>
          )}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((chk) => {
            const st = CHECK_STATUS[chk.status as keyof typeof CHECK_STATUS] ?? CHECK_STATUS.OPEN
            const res = chk.result ? (CHECK_RESULT[chk.result as keyof typeof CHECK_RESULT] ?? null) : null
            return (
              <Link key={chk.id} href={`/checks/${chk.id}`}
                className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group block"
                style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StatusDot status={chk.status} />
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                  </div>
                  <ResultIcon result={chk.result} />
                </div>

                <div className="mb-3">
                  <div className="text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors truncate">
                    {chk.employerName}
                  </div>
                  {chk.employerContact && (
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{chk.employerContact}</div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2.5 border-t border-slate-50">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-[9px] font-bold text-indigo-700 flex-shrink-0">
                    {chk.candidate.firstName[0]}{chk.candidate.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-slate-600 truncate">
                      {chk.candidate.firstName} {chk.candidate.lastName}
                    </div>
                    {chk.candidate.position && (
                      <div className="text-[10px] text-slate-400 truncate">{chk.candidate.position}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <RatingStars rating={chk.rating} />
                    {res && (
                      <span className={`text-[9px] font-bold ${res.color}`}>{res.label}</span>
                    )}
                    <span className="text-[9px] text-slate-300">{formatDate(chk.updatedAt)}</span>
                  </div>
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-3.5 h-3.5 text-violet-400" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
