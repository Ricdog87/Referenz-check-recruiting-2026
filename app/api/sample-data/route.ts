import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureSchema, withDbRecovery } from '@/lib/db-init'

export const dynamic = 'force-dynamic'

/**
 * Seedet das eingeloggte Konto mit 4 realistischen Beispiel-Kandidaten +
 * 6 Referenzprüfungen. Idempotent: Wird das Konto bereits Daten hat,
 * antworten wir freundlich und seedenicht erneut, damit User-Daten nie
 * überschrieben werden.
 *
 * Use-Case: Frisch registrierter User klickt im Onboarding „Beispiel-Daten
 * laden" — er sieht sofort ein vollständiges Dashboard mit Charts.
 */
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }
  const userId = session.user.id

  try {
    await ensureSchema()

    // Schon Daten? Nicht überschreiben.
    const existing = await withDbRecovery(() =>
      prisma.candidate.count({ where: { userId } }),
    )
    if (existing > 0) {
      return NextResponse.json(
        { ok: false, error: 'Ihr Konto enthält bereits Daten. Beispiel-Daten werden nur in leere Konten geladen.' },
        { status: 409 },
      )
    }

    let created = 0
    for (const c of SAMPLE_CANDIDATES) {
      await withDbRecovery(() =>
        prisma.candidate.create({
          data: {
            userId,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phone: c.phone,
            position: c.position,
            department: c.department,
            notes: c.notes,
            status: c.status,
            gdprConsent: c.gdprConsent,
            gdprConsentDate: c.gdprConsent ? new Date() : null,
            gdprConsentIp: c.gdprConsent ? 'sample-data' : null,
            createdAt: new Date(Date.now() - c.createdAtOffsetDays * 24 * 60 * 60 * 1000),
            checks: {
              create: c.checks.map((chk) => ({
                ...chk,
                createdAt: new Date(Date.now() - chk.createdAtOffsetDays * 24 * 60 * 60 * 1000),
              })),
            },
          },
        }),
      )
      created++
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'SAMPLE_DATA_LOADED',
          entity: 'Candidate',
          details: `${created} Beispiel-Kandidaten geseedet`,
        },
      })
    } catch (err) {
      console.error('sample_audit_warn', err)
    }

    return NextResponse.json({ ok: true, candidates: created })
  } catch (error) {
    console.error('sample_data_error', error)
    return NextResponse.json(
      { error: 'Beispiel-Daten konnten nicht geladen werden. Bitte erneut versuchen.' },
      { status: 500 },
    )
  }
}

// ─────────────────────────────────────────────────────────────────
// Sample-Datensatz — 4 Kandidaten, 6 Checks. Anonymisiert, realistisch.
// ─────────────────────────────────────────────────────────────────

type SampleCheck = {
  employerName: string
  employerContact?: string
  employerPhone?: string
  employerEmail?: string
  position?: string
  startDate?: string
  endDate?: string
  status: string
  result?: string | null
  callNotes?: string
  discrepancies?: string
  rating?: number
  calledAt?: Date
  createdAtOffsetDays: number
}

type SampleCandidate = {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  position: string
  department?: string
  notes?: string
  status: string
  gdprConsent: boolean
  createdAtOffsetDays: number
  checks: SampleCheck[]
}

const SAMPLE_CANDIDATES: SampleCandidate[] = [
  {
    firstName: 'Lukas',
    lastName: 'Berger',
    email: 'lukas.berger@example.com',
    phone: '+49 30 1234567',
    position: 'Senior Backend Engineer',
    department: 'Engineering',
    notes: 'Bewerbung über LinkedIn. Stark in Go & Postgres.',
    status: 'IN_REVIEW',
    gdprConsent: true,
    createdAtOffsetDays: 5,
    checks: [
      {
        employerName: 'Zalando SE',
        employerContact: 'Anna Müller',
        employerPhone: '+49 30 200900',
        employerEmail: 'a.mueller@example.de',
        position: 'Backend Engineer',
        startDate: '2020-03',
        endDate: '2023-08',
        status: 'COMPLETED',
        result: 'VERIFIED',
        callNotes: 'Position und Tätigkeiten bestätigt. Sehr empfehlenswert, technisch stark, sehr zuverlässig.',
        rating: 5,
        calledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        createdAtOffsetDays: 4,
      },
      {
        employerName: 'Delivery Hero SE',
        employerContact: 'Tom Schneider',
        position: 'Software Engineer',
        startDate: '2017-06',
        endDate: '2020-02',
        status: 'IN_PROGRESS',
        result: null,
        createdAtOffsetDays: 2,
      },
    ],
  },
  {
    firstName: 'Sarah',
    lastName: 'Hoffmann',
    email: 'sarah.hoffmann@example.com',
    phone: '+49 89 998877',
    position: 'Senior Product Manager',
    department: 'Product',
    notes: 'Empfehlung über Netzwerk. High-Performer.',
    status: 'COMPLETED',
    gdprConsent: true,
    createdAtOffsetDays: 9,
    checks: [
      {
        employerName: 'BMW Group',
        employerContact: 'Martin Wagner',
        position: 'Senior PM',
        startDate: '2019-01',
        endDate: '2023-12',
        status: 'COMPLETED',
        result: 'VERIFIED',
        callNotes: 'Sehr gute Performance, würde sie wieder einstellen.',
        rating: 5,
        calledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        createdAtOffsetDays: 7,
      },
    ],
  },
  {
    firstName: 'Jonas',
    lastName: 'Vogel',
    email: 'jonas.vogel@example.com',
    phone: '+49 40 776655',
    position: 'Data Scientist',
    department: 'Analytics',
    notes: 'Quereinsteiger aus dem akademischen Bereich.',
    status: 'IN_REVIEW',
    gdprConsent: true,
    createdAtOffsetDays: 3,
    checks: [
      {
        employerName: 'Otto Group',
        employerContact: 'Karin Lehmann',
        position: 'Data Analyst',
        startDate: '2021-09',
        endDate: '2024-02',
        status: 'COMPLETED',
        result: 'DISCREPANCY_FOUND',
        callNotes: 'Position als „Senior Data Scientist" angegeben — laut HR war es „Data Analyst". Andere Angaben korrekt.',
        discrepancies: 'Job-Titel weicht ab (Senior Data Scientist vs. Data Analyst).',
        rating: 3,
        calledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        createdAtOffsetDays: 2,
      },
    ],
  },
  {
    firstName: 'Elif',
    lastName: 'Demir',
    email: 'elif.demir@example.com',
    phone: '+49 221 445566',
    position: 'UX Designer',
    department: 'Design',
    notes: 'Portfolio sehr stark.',
    status: 'PENDING',
    gdprConsent: false,
    createdAtOffsetDays: 1,
    checks: [
      {
        employerName: 'REWE Digital',
        position: 'UX Designer',
        startDate: '2022-04',
        endDate: '2024-04',
        status: 'OPEN',
        result: null,
        createdAtOffsetDays: 1,
      },
      {
        employerName: 'XING SE',
        position: 'Junior Designer',
        startDate: '2020-09',
        endDate: '2022-03',
        status: 'OPEN',
        result: null,
        createdAtOffsetDays: 1,
      },
    ],
  },
]
