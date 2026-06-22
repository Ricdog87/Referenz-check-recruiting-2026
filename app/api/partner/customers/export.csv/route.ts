/**
 * GET /api/partner/customers/export.csv
 *
 * Streamt eine CSV mit allen Mandanten des eingeloggten Partners —
 * inkl. EK, VK, Marge, Status. Format: Semikolon-separiert (Excel-de
 * öffnet so direkt), UTF-8 mit BOM für saubere Umlaut-Darstellung.
 *
 * Gating:
 *   - Flag PARTNER_PROGRAM_ENABLED
 *   - getPartnerSession() + status=APPROVED
 *   - withPartnerScope() im findMany — strukturell unmöglich, fremde
 *     Daten zu exportieren
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { getPartnerSession } from '@/lib/partner/session'
import { withPartnerScope } from '@/lib/partner/scope'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const CSV_HEADER = [
  'Firma',
  'Kontakt Vorname',
  'Kontakt Nachname',
  'Kontakt E-Mail',
  'Plan',
  'Abrechnungszyklus',
  'EK (EUR)',
  'VK (EUR)',
  'Marge (EUR)',
  'Status',
  'Aktiviert am',
  'Pausiert am',
  'Gekuendigt am',
]

function csvEscape(s: string | null | undefined): string {
  if (s === null || s === undefined) return ''
  const str = String(s)
  if (/[;"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function fmtEuro(cents: number): string {
  // de-Format: 1234,56 (Komma als Dezimaltrenner, kein Tausender-Sep für CSV)
  return (cents / 100).toFixed(2).replace('.', ',')
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return ''
  return d.toISOString().slice(0, 10)
}

export async function GET() {
  if (!isPartnerProgramEnabled()) return new NextResponse('Not Found', { status: 404 })

  const session = await getPartnerSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  if (session.status !== 'APPROVED') return NextResponse.json({ error: 'Account not approved' }, { status: 403 })

  try {
    const rows = await prisma.partnerCustomer.findMany({
      where: withPartnerScope(session.id),
      orderBy: { createdAt: 'desc' },
    })

    const lines: string[] = [CSV_HEADER.join(';')]
    for (const r of rows) {
      lines.push(
        [
          csvEscape(r.company),
          csvEscape(r.contactFirstName),
          csvEscape(r.contactLastName),
          csvEscape(r.contactEmail),
          csvEscape(r.planKey),
          csvEscape(r.billingCycle),
          fmtEuro(r.ekPriceCents),
          fmtEuro(r.endPriceCents),
          fmtEuro(r.marginCents),
          csvEscape(r.status),
          fmtDate(r.activatedAt),
          fmtDate(r.pausedAt),
          fmtDate(r.churnedAt),
        ].join(';'),
      )
    }

    const bom = '﻿' // UTF-8 BOM für Excel
    const csv = bom + lines.join('\r\n')

    const today = new Date().toISOString().slice(0, 10)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="partner-mandanten-${today}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    logger.error('partner_csv_export_error', err)
    return NextResponse.json({ error: 'CSV-Export fehlgeschlagen.' }, { status: 500 })
  }
}
