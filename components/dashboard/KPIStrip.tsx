'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Users, CheckCircle2, AlertTriangle, Clock, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'

function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number>()
  const startRef = useRef<number>()
  useEffect(() => {
    if (target === 0) { setCount(0); return }
    startRef.current = undefined
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const p = Math.min((ts - startRef.current) / duration, 1)
      const e = 1 - Math.pow(1 - p, 4)
      setCount(Math.floor(e * target))
      if (p < 1) rafRef.current = requestAnimationFrame(step)
      else setCount(target)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])
  return count
}

interface KPIItem {
  label: string
  value: number | string
  sub: string
  icon: React.ComponentType<{ className?: string }>
  delta: string
  href: string
  colorClass: string
  glowColor: string
}

function KPICard({ item, index }: { item: KPIItem; index: number }) {
  const numeric = typeof item.value === 'number'
  const animated = useCountUp(numeric ? (item.value as number) : 0, 900 + index * 150)
  const display = numeric ? animated : item.value
  const isUp = item.delta.startsWith('+')
  const isDown = item.delta.startsWith('−') || item.delta.startsWith('-')
  const DIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus
  const deltaColor = isUp ? 'text-emerald-600' : isDown ? 'text-rose-500' : 'text-slate-400'

  return (
    <Link href={item.href} className="group relative bg-white rounded-2xl border border-slate-100 p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 overflow-hidden block"
      style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at top left, ${item.glowColor}, transparent 65%)` }} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.colorClass}`}>
            <item.icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
          </div>
          <div className={`flex items-center gap-1 text-[11px] font-bold ${deltaColor}`}>
            <DIcon className="w-3 h-3" />
            {item.delta}
          </div>
        </div>
        <div className="text-[2rem] font-black tracking-tighter text-slate-900 leading-none tabular-nums mb-1">
          {display}
        </div>
        <div className="text-xs font-semibold text-slate-600">{item.label}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">{item.sub}</div>
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </Link>
  )
}

interface KPIStripProps {
  totalCandidates: number
  activeCandidates: number
  verificationRate: number
  verifiedChecks: number
  discrepancies: number
  avgTurnaround: number
}

export function KPIStrip({ totalCandidates, activeCandidates, verificationRate, verifiedChecks, discrepancies, avgTurnaround }: KPIStripProps) {
  const items: KPIItem[] = [
    {
      label: 'Kandidaten',
      value: totalCandidates,
      sub: `${activeCandidates} aktiv in Prüfung`,
      icon: Users,
      delta: '+12%',
      href: '/candidates',
      colorClass: 'text-indigo-600 bg-indigo-50',
      glowColor: 'rgba(99,102,241,0.12)',
    },
    {
      label: 'Verifizierungsrate',
      value: `${verificationRate}%`,
      sub: `${verifiedChecks} verifiziert`,
      icon: CheckCircle2,
      delta: '+4%',
      href: '/checks',
      colorClass: 'text-emerald-600 bg-emerald-50',
      glowColor: 'rgba(16,185,129,0.12)',
    },
    {
      label: 'Diskrepanzen',
      value: discrepancies,
      sub: discrepancies === 0 ? 'Keine Auffälligkeiten' : 'Auffälligkeiten',
      icon: AlertTriangle,
      delta: discrepancies > 0 ? `+${discrepancies}` : '0',
      href: '/checks?status=COMPLETED',
      colorClass: discrepancies > 0 ? 'text-rose-600 bg-rose-50' : 'text-slate-400 bg-slate-50',
      glowColor: 'rgba(244,63,94,0.10)',
    },
    {
      label: 'Ø Durchlaufzeit',
      value: `${Math.round(avgTurnaround)} h`,
      sub: 'letzte 7 Tage',
      icon: Clock,
      delta: '−18%',
      href: '/analytics',
      colorClass: 'text-violet-600 bg-violet-50',
      glowColor: 'rgba(139,92,246,0.12)',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => <KPICard key={item.label} item={item} index={i} />)}
    </div>
  )
}
