'use client'

import dynamic from 'next/dynamic'

/**
 * Dynamic import wrapper for Recharts-based dashboard visualizations.
 *
 * Why: Recharts pulls ~40KB of D3-derived code that the Dashboard's first
 * render does not strictly need (the user's eye lands on the WelcomeBar
 * + KPI cards first). By dynamic-importing the chart trio with
 * ssr: false + a height-matched skeleton, we ship the dashboard shell
 * faster and let the charts hydrate in the background.
 *
 * Trade-off: a brief skeleton flash for charts. Acceptable given the
 * perceived TTI improvement.
 */

const ChartSkeleton = ({ height }: { height: number }) => (
  <div
    className="w-full rounded-lg bg-gradient-to-b from-bg-tertiary/50 to-bg-tertiary/20 animate-pulse"
    style={{ height }}
  />
)

export const ActivityAreaChart = dynamic(
  () => import('./DashboardCharts').then((m) => m.ActivityAreaChart),
  { ssr: false, loading: () => <ChartSkeleton height={240} /> },
)

export const StatusPieChart = dynamic(
  () => import('./DashboardCharts').then((m) => m.StatusPieChart),
  { ssr: false, loading: () => <ChartSkeleton height={240} /> },
)

export const TurnaroundBarChart = dynamic(
  () => import('./DashboardCharts').then((m) => m.TurnaroundBarChart),
  { ssr: false, loading: () => <ChartSkeleton height={240} /> },
)
