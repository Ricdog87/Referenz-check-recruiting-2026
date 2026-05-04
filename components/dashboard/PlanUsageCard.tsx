import Link from 'next/link'
import { Zap, ArrowRight, TrendingUp } from 'lucide-react'

interface PlanUsageCardProps {
  planName: string
  accountTypeShort: string
  usedChecks: number
  checkLimit: number
  usagePct: number
}

export function PlanUsageCard({ planName, accountTypeShort, usedChecks, checkLimit, usagePct }: PlanUsageCardProps) {
  const barColor = usagePct >= 90 ? 'from-rose-500 to-red-500' : usagePct >= 70 ? 'from-amber-400 to-orange-500' : 'from-indigo-500 to-violet-500'
  const textColor = usagePct >= 90 ? 'text-rose-600' : usagePct >= 70 ? 'text-amber-600' : 'text-indigo-600'

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white flex-shrink-0 shadow-md">
        <Zap className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold text-slate-800">{planName}-Paket</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">{accountTypeShort}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-1000`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <span className={`text-xs font-bold tabular-nums ${textColor}`}>{usedChecks}/{checkLimit}</span>
          <span className="text-[11px] text-slate-400">{usagePct}%</span>
        </div>
        {usagePct >= 80 && (
          <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Kontingent fast ausgeschöpft — Upgrade empfohlen
          </p>
        )}
      </div>

      <Link href="/preise" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors whitespace-nowrap">
        Paket erweitern <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
