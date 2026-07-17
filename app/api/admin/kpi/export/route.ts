import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/reviewer'
import { isKpiCockpitEnabled } from '@/lib/flags'
import { buildMetricCsv, KPI_METRICS, type KpiMetric } from '@/lib/kpi'

export const dynamic = 'force-dynamic'

/**
 * CSV-Export je KPI-Metrik (?metric=summary|revenue).
 * Doppelt abgesichert: Flag-Gate (default off) + Admin-Rolle. Ohne beides
 * gibt es die Route faktisch nicht (404) bzw. keinen Zugriff (403).
 */
export async function GET(req: NextRequest) {
  if (!isKpiCockpitEnabled()) return new NextResponse('Not Found', { status: 404 })

  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const raw = req.nextUrl.searchParams.get('metric') ?? 'summary'
  if (!KPI_METRICS.includes(raw as KpiMetric)) {
    return NextResponse.json(
      { error: `Unbekannte Metrik. Erlaubt: ${KPI_METRICS.join(', ')}.` },
      { status: 400 },
    )
  }

  const csv = await buildMetricCsv(raw as KpiMetric)
  const filename = `candiq-kpi-${raw}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
