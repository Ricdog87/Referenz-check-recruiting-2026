import Link from 'next/link'
import { AlertTriangle, ArrowRight, Sparkles, Clock } from 'lucide-react'
import type { LimitState } from '@/lib/limits'

interface Props {
  state: LimitState
}

/**
 * Drei Zustände:
 *  - Trial abgelaufen + nichts gekauft → roter Trial-Expired Banner
 *  - Plan-Limit erreicht (nicht im Trial) → roter Over-Limit Banner
 *  - 80%+ erreicht (nicht im Trial) → gelber Approaching Banner
 *  - sonst: nichts (das normale Plan-Usage-Element im Dashboard reicht)
 */
export function PlanLimitBanner({ state }: Props) {
  if (state.isTrialExpired && !state.isOverLimit) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/40 p-4 flex items-start gap-3 shadow-card">
        <div className="w-10 h-10 rounded-xl bg-amber-200/60 border border-amber-300 flex items-center justify-center flex-shrink-0 text-amber-800">
          <Clock className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-amber-900 mb-0.5">
            Ihr 14-Tage-Trial ist abgelaufen
          </div>
          <p className="text-xs text-amber-800 leading-relaxed mb-2">
            Sie können candiq weiterhin im Rahmen Ihres <strong>{state.planName}-Plans</strong> nutzen
            ({state.monthlyCheckLimit} Prüfungen/Monat inkl.). Für mehr wechseln Sie auf einen größeren Plan.
          </p>
          <Link
            href="/preise"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-950"
          >
            Pläne ansehen <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    )
  }

  if (state.isOverLimit) {
    return (
      <div className="rounded-2xl border border-rose-300 bg-gradient-to-br from-rose-50 to-rose-100/40 p-4 flex items-start gap-3 shadow-card">
        <div className="w-10 h-10 rounded-xl bg-rose-200/60 border border-rose-300 flex items-center justify-center flex-shrink-0 text-rose-700">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-rose-900 mb-0.5">
            Plan-Limit erreicht — {state.monthlyChecksUsed}/{state.monthlyCheckLimit} Prüfungen diesen Monat
          </div>
          <p className="text-xs text-rose-800 leading-relaxed mb-2">
            Sie können bestehende Prüfungen weiter bearbeiten. Für neue Prüfungen wechseln Sie bitte auf
            einen Plan mit mehr Inklusiv-Checks oder buchen Sie ein Add-on.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/preise"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-full"
            >
              <Sparkles className="w-3 h-3" /> Plan upgraden
            </Link>
            <Link
              href="/addons"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-900 bg-white border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-full"
            >
              Add-on buchen <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (state.isApproachingLimit) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-amber-900">
            {state.monthlyChecksUsed}/{state.monthlyCheckLimit} Inklusiv-Prüfungen diesen Monat
            verbraucht ({Math.round(state.usageRatio * 100)} %)
          </div>
          <div className="text-[11px] text-amber-800/80 mt-0.5">
            Plan rechtzeitig upgraden, um nicht ans Limit zu stoßen.
          </div>
        </div>
        <Link href="/preise" className="text-xs font-bold text-amber-900 hover:text-amber-950 whitespace-nowrap">
          Upgraden →
        </Link>
      </div>
    )
  }

  return null
}
