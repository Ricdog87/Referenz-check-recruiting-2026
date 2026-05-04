'use client'

import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number>()
  const startRef = useRef<number>()

  useEffect(() => {
    if (target === 0) { setCount(0); return }
    startRef.current = undefined
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
      else setCount(target)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return count
}

type Tone = 'brand' | 'emerald' | 'rose' | 'violet' | 'amber' | 'cyan'

interface AnimatedStatCardProps {
  label: string
  value: string | number
  sub: string
  icon: React.ComponentType<{ className?: string }>
  tone: Tone
  delta: string
  href?: string
  description?: string
}

const TONE_STYLES: Record<Tone, { icon: string; glow: string; delta: string; border: string; badge: string }> = {
  brand:   { icon: 'text-indigo-600 bg-indigo-50',   glow: 'rgba(99,102,241,0.15)',  delta: 'text-indigo-700 bg-indigo-50',   border: 'hover:border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
  emerald: { icon: 'text-emerald-600 bg-emerald-50', glow: 'rgba(16,185,129,0.15)',  delta: 'text-emerald-700 bg-emerald-50', border: 'hover:border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  rose:    { icon: 'text-rose-600 bg-rose-50',       glow: 'rgba(244,63,94,0.15)',   delta: 'text-rose-700 bg-rose-50',       border: 'hover:border-rose-200',    badge: 'bg-rose-100 text-rose-700' },
  violet:  { icon: 'text-violet-600 bg-violet-50',   glow: 'rgba(139,92,246,0.15)',  delta: 'text-violet-700 bg-violet-50',   border: 'hover:border-violet-200',   badge: 'bg-violet-100 text-violet-700' },
  amber:   { icon: 'text-amber-600 bg-amber-50',     glow: 'rgba(245,158,11,0.15)',  delta: 'text-amber-700 bg-amber-50',     border: 'hover:border-amber-200',    badge: 'bg-amber-100 text-amber-700' },
  cyan:    { icon: 'text-cyan-600 bg-cyan-50',       glow: 'rgba(6,182,212,0.15)',   delta: 'text-cyan-700 bg-cyan-50',       border: 'hover:border-cyan-200',     badge: 'bg-cyan-100 text-cyan-700' },
}

export function AnimatedStatCard({ label, value, sub, icon: Icon, tone, delta, description }: AnimatedStatCardProps) {
  const styles = TONE_STYLES[tone]
  const isNumeric = typeof value === 'number'
  const animated = useCountUp(isNumeric ? (value as number) : 0)
  const displayValue = isNumeric ? animated : value

  const isPositiveDelta = delta.startsWith('+')
  const isNegativeDelta = delta.startsWith('−') || delta.startsWith('-')
  const DeltaIcon = isPositiveDelta ? TrendingUp : isNegativeDelta ? TrendingDown : Minus

  return (
    <div
      className={`group relative bg-white border border-slate-100 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${styles.border} cursor-default overflow-hidden`}
      style={{ boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)' }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at top left, ${styles.glow}, transparent 70%)` }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${styles.icon} shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${styles.badge}`}>
            <DeltaIcon className="w-3 h-3" />
            {delta}
          </div>
        </div>

        <div className="text-[2rem] font-black tracking-tighter text-slate-900 leading-none mb-1 tabular-nums">
          {displayValue}
        </div>
        <div className="text-sm font-semibold text-slate-700 mb-0.5">{label}</div>
        <div className="text-xs text-slate-400">{sub}</div>
        {description && (
          <div className="mt-3 pt-3 border-t border-slate-50 text-[11px] text-slate-400 leading-relaxed">{description}</div>
        )}
      </div>
    </div>
  )
}
