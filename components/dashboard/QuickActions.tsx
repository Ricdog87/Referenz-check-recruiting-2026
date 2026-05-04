'use client'

import Link from 'next/link'
import { Plus, Phone, Sparkles, FileSearch, Download, Shield } from 'lucide-react'

const ACTIONS = [
  {
    icon: Plus,
    label: 'Kandidat anlegen',
    desc: 'Neuen Kandidaten erfassen',
    href: '/candidates/new',
    style: 'from-indigo-500 to-violet-500',
    shadow: 'rgba(99,102,241,0.35)',
  },
  {
    icon: Phone,
    label: 'Prüfung starten',
    desc: 'Referenzcheck beauftragen',
    href: '/checks/new',
    style: 'from-violet-500 to-purple-600',
    shadow: 'rgba(139,92,246,0.35)',
  },
  {
    icon: Sparkles,
    label: 'Add-on buchen',
    desc: 'Express, Interview & mehr',
    href: '/addons',
    style: 'from-amber-400 to-orange-500',
    shadow: 'rgba(245,158,11,0.35)',
  },
  {
    icon: FileSearch,
    label: 'Analytics',
    desc: 'Auswertungen & Trends',
    href: '/analytics',
    style: 'from-emerald-500 to-teal-500',
    shadow: 'rgba(16,185,129,0.35)',
  },
  {
    icon: Shield,
    label: 'Audit-Trail',
    desc: 'DSGVO-Protokoll einsehen',
    href: '/audit',
    style: 'from-slate-600 to-slate-800',
    shadow: 'rgba(15,23,42,0.25)',
  },
  {
    icon: Download,
    label: 'Export',
    desc: 'Daten exportieren',
    href: '/settings',
    style: 'from-cyan-500 to-blue-500',
    shadow: 'rgba(6,182,212,0.35)',
  },
]

export function QuickActions() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">Schnellzugriff</h3>
        <span className="text-[11px] text-slate-400">6 Aktionen</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-all duration-200 text-center"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg bg-gradient-to-br"
              style={{
                backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                boxShadow: `0 4px 12px ${a.shadow}`,
              }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${a.style}`}>
                <a.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-700 leading-tight">{a.label}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
