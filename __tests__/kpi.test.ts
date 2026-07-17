/**
 * Phase 3 — KPI-Cockpit: Tests für alle Aggregationen.
 *
 * Reine Rechen-Helfer werden direkt geprüft; die Snapshot-Orchestrierung und
 * der CSV-Export laufen gegen ein gemocktes Prisma (kein DB-Zugriff).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── Reine Helfer (kein Prisma nötig) ──────────────────────────────────────

async function importPure() {
  vi.resetModules()
  vi.doMock('server-only', () => ({}))
  vi.doMock('@/lib/db', () => ({ prisma: {} }))
  return import('@/lib/kpi')
}

describe('computeMrr', () => {
  it('summiert Monatspreise; YEARLY nutzt die günstigere Jahres-Monatsrate', async () => {
    const { computeMrr } = await importPure()
    // STARTER monthly 79 / annual 65; PROFESSIONAL monthly 249 / annual 199
    const mrr = computeMrr([
      { plan: 'STARTER', billingInterval: 'MONTHLY' },
      { plan: 'STARTER', billingInterval: 'YEARLY' },
      { plan: 'PROFESSIONAL', billingInterval: null }, // null → MONTHLY
    ])
    expect(mrr).toBe(79 + 65 + 249)
  })

  it('ignoriert unbekannte Pläne (kein Preis hinterlegt)', async () => {
    const { computeMrr } = await importPure()
    expect(computeMrr([{ plan: 'GHOST', billingInterval: 'MONTHLY' }])).toBe(0)
  })

  it('ENTERPRISE (Preis 0, Custom) trägt 0 zum MRR bei', async () => {
    const { computeMrr } = await importPure()
    expect(computeMrr([{ plan: 'ENTERPRISE', billingInterval: 'MONTHLY' }])).toBe(0)
  })

  it('leere Liste → 0', async () => {
    const { computeMrr } = await importPure()
    expect(computeMrr([])).toBe(0)
  })
})

describe('computeArr', () => {
  it('ARR = MRR × 12', async () => {
    const { computeArr } = await importPure()
    expect(computeArr(1000)).toBe(12000)
    expect(computeArr(0)).toBe(0)
  })
})

describe('averageTurnaroundHours', () => {
  it('mittelt die Stunden zwischen Anlage und Abschluss', async () => {
    const { averageTurnaroundHours } = await importPure()
    const h = (n: number) => new Date(2026, 0, 1, n, 0, 0)
    const avg = averageTurnaroundHours([
      { createdAt: h(0), completedAt: h(2) }, // 2h
      { createdAt: h(0), completedAt: h(4) }, // 4h
    ])
    expect(avg).toBe(3)
  })

  it('leere Liste → null (kein sinnvoller Mittelwert)', async () => {
    const { averageTurnaroundHours } = await importPure()
    expect(averageTurnaroundHours([])).toBeNull()
  })
})

describe('revenueBreakdown', () => {
  it('gruppiert je Plan × Intervall und summiert Subtotal', async () => {
    const { revenueBreakdown } = await importPure()
    const rows = revenueBreakdown([
      { plan: 'STARTER', billingInterval: 'MONTHLY' },
      { plan: 'STARTER', billingInterval: 'MONTHLY' },
      { plan: 'STARTER', billingInterval: 'YEARLY' },
    ])
    const monthly = rows.find((r) => r.plan === 'STARTER' && r.billingInterval === 'MONTHLY')
    const yearly = rows.find((r) => r.plan === 'STARTER' && r.billingInterval === 'YEARLY')
    expect(monthly).toMatchObject({ customers: 2, monthlyRatePerCustomer: 79, subtotal: 158 })
    expect(yearly).toMatchObject({ customers: 1, monthlyRatePerCustomer: 65, subtotal: 65 })
  })

  it('sortiert absteigend nach Subtotal', async () => {
    const { revenueBreakdown } = await importPure()
    const rows = revenueBreakdown([
      { plan: 'STARTER', billingInterval: 'MONTHLY' }, // 79
      { plan: 'BUSINESS', billingInterval: 'MONTHLY' }, // 599
    ])
    expect(rows[0].plan).toBe('BUSINESS')
  })
})

describe('CSV-Serialisierung', () => {
  it('csvCell quotet Felder mit Komma/Quote/Zeilenumbruch', async () => {
    const { csvCell } = await importPure()
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('sag "hi"')).toBe('"sag ""hi"""')
    expect(csvCell(42)).toBe('42')
  })

  it('toCsv baut Header + Zeilen mit CRLF', async () => {
    const { toCsv } = await importPure()
    const csv = toCsv(['a', 'b'], [[1, 2], [3, 4]])
    expect(csv).toBe('a,b\r\n1,2\r\n3,4\r\n')
  })
})

// ── Snapshot & CSV-Export gegen gemocktes Prisma ──────────────────────────

const prismaMock = {
  user: { findMany: vi.fn(), count: vi.fn() },
  referenceCheck: { count: vi.fn(), findMany: vi.fn() },
  partnerCustomer: { count: vi.fn() },
}

async function importWithDb() {
  vi.resetModules()
  vi.doMock('server-only', () => ({}))
  vi.doMock('@/lib/db', () => ({ prisma: prismaMock }))
  return import('@/lib/kpi')
}

beforeEach(() => {
  prismaMock.user.findMany.mockReset()
  prismaMock.user.count.mockReset()
  prismaMock.referenceCheck.count.mockReset()
  prismaMock.referenceCheck.findMany.mockReset()
  prismaMock.partnerCustomer.count.mockReset()
})

describe('getKpiSnapshot', () => {
  it('führt alle Aggregationen zusammen', async () => {
    const { getKpiSnapshot } = await importWithDb()
    const now = new Date(2026, 6, 17, 12, 0, 0)

    prismaMock.user.findMany.mockResolvedValue([
      { plan: 'PROFESSIONAL', billingInterval: 'MONTHLY' }, // 249
      { plan: 'STARTER', billingInterval: 'YEARLY' }, // 65
    ])
    // count: activePaying, totalCustomers, trialing (in dieser Reihenfolge)
    prismaMock.user.count
      .mockResolvedValueOnce(2) // activePayingCustomers
      .mockResolvedValueOnce(5) // totalCustomers
      .mockResolvedValueOnce(1) // trialingCustomers
    // referenceCheck.count: checksTotal, checksLast30Days
    prismaMock.referenceCheck.count
      .mockResolvedValueOnce(40) // total
      .mockResolvedValueOnce(9) // last 30d
    prismaMock.referenceCheck.findMany
      // completedList
      .mockResolvedValueOnce([
        { createdAt: new Date(2026, 6, 1, 0), updatedAt: new Date(2026, 6, 1, 6) }, // 6h
        { createdAt: new Date(2026, 6, 2, 0), updatedAt: new Date(2026, 6, 2, 12) }, // 12h
      ])
      // verifiedCandidates (distinct)
      .mockResolvedValueOnce([{ candidateId: 'c1' }, { candidateId: 'c2' }, { candidateId: 'c3' }])
    prismaMock.partnerCustomer.count
      .mockResolvedValueOnce(7) // partnerCustomers
      .mockResolvedValueOnce(4) // activePartnerCustomers

    const s = await getKpiSnapshot(now)

    expect(s.mrr).toBe(249 + 65)
    expect(s.arr).toBe((249 + 65) * 12)
    expect(s.activePayingCustomers).toBe(2)
    expect(s.totalCustomers).toBe(5)
    expect(s.trialingCustomers).toBe(1)
    expect(s.checksTotal).toBe(40)
    expect(s.checksLast30Days).toBe(9)
    expect(s.completedChecks).toBe(2)
    expect(s.avgTurnaroundHours).toBe(9) // (6+12)/2
    expect(s.credentialInventory).toBe(3)
    expect(s.partnerCustomers).toBe(7)
    expect(s.activePartnerCustomers).toBe(4)
    expect(s.zvooveLinkedCustomers).toBe(0)
    expect(s.generatedAt).toBe(now.toISOString())
  })

  it('30-Tage-Fenster: Query nutzt gte = now − 30 Tage', async () => {
    const { getKpiSnapshot } = await importWithDb()
    const now = new Date(2026, 6, 17, 0, 0, 0)
    prismaMock.user.findMany.mockResolvedValue([])
    prismaMock.user.count.mockResolvedValue(0)
    prismaMock.referenceCheck.count.mockResolvedValue(0)
    prismaMock.referenceCheck.findMany.mockResolvedValue([])
    prismaMock.partnerCustomer.count.mockResolvedValue(0)

    await getKpiSnapshot(now)

    // zweiter referenceCheck.count-Call ist der 30d-Filter
    const call = prismaMock.referenceCheck.count.mock.calls[1][0]
    const gte: Date = call.where.createdAt.gte
    const diffDays = (now.getTime() - gte.getTime()) / (24 * 3600 * 1000)
    expect(diffDays).toBe(30)
  })

  it('credential-Query nutzt distinct candidateId + result=VERIFIED', async () => {
    const { getKpiSnapshot } = await importWithDb()
    prismaMock.user.findMany.mockResolvedValue([])
    prismaMock.user.count.mockResolvedValue(0)
    prismaMock.referenceCheck.count.mockResolvedValue(0)
    prismaMock.referenceCheck.findMany.mockResolvedValue([])
    prismaMock.partnerCustomer.count.mockResolvedValue(0)

    await getKpiSnapshot(new Date(2026, 6, 17))

    // zweiter findMany-Call = verifiedCandidates
    const call = prismaMock.referenceCheck.findMany.mock.calls[1][0]
    expect(call.where.result).toBe('VERIFIED')
    expect(call.distinct).toEqual(['candidateId'])
  })
})

describe('buildMetricCsv', () => {
  it('summary: eine Zeile je Kennzahl', async () => {
    const { buildMetricCsv } = await importWithDb()
    const now = new Date(2026, 6, 17, 12)
    prismaMock.user.findMany.mockResolvedValue([{ plan: 'STARTER', billingInterval: 'MONTHLY' }])
    prismaMock.user.count.mockResolvedValue(1)
    prismaMock.referenceCheck.count.mockResolvedValue(3)
    prismaMock.referenceCheck.findMany.mockResolvedValue([])
    prismaMock.partnerCustomer.count.mockResolvedValue(0)

    const csv = await buildMetricCsv('summary', now)
    expect(csv.startsWith('metric,value\r\n')).toBe(true)
    expect(csv).toContain('mrr_eur,79')
    expect(csv).toContain('arr_eur,948')
    // null-Turnaround wird als leeres Feld serialisiert
    expect(csv).toContain('avg_turnaround_hours,\r\n')
  })

  it('revenue: Aufschlüsselung je Plan × Intervall', async () => {
    const { buildMetricCsv } = await importWithDb()
    prismaMock.user.findMany.mockResolvedValue([
      { plan: 'STARTER', billingInterval: 'MONTHLY' },
      { plan: 'STARTER', billingInterval: 'MONTHLY' },
    ])
    const csv = await buildMetricCsv('revenue')
    expect(csv.split('\r\n')[0]).toBe(
      'plan,billing_interval,customers,monthly_rate_per_customer_eur,subtotal_eur',
    )
    expect(csv).toContain('STARTER,MONTHLY,2,79,158')
  })
})
