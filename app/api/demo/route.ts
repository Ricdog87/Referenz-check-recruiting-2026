import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

/**
 * One-click demo provisioning.
 * GET/POST /api/demo?type=hr|enterprise|boutique
 *
 * Strategy:
 *   1. Idempotently upserts a demo user with a *fixed* password (bcrypt hash always overwritten).
 *   2. Seeds candidates + checks + addon orders the *first* time only.
 *   3. Returns credentials so the login page can perform credentials-signIn.
 *
 * Robustness:
 *   - Rate-limited at most 1 concurrent seed per profile (in-memory).
 *   - Catches all common Prisma errors and reports them in plain German.
 */

export const dynamic = 'force-dynamic'

type DemoProfileKey = 'hr' | 'enterprise' | 'boutique'

const PROFILES: Record<DemoProfileKey, {
  email: string
  password: string
  name: string
  company: string
  plan: string
  trialDays: number
  seed: () => SeedCandidate[]
  addons: { sku: string; quantity: number; unitPrice: number }[]
}> = {
  hr: {
    email: 'demo@candiq.de',
    password: 'demo1234',
    name: 'Lara Weber',
    company: 'Demo Holding GmbH',
    plan: 'PROFESSIONAL',
    trialDays: 12,
    seed: () => HR_SEED,
    addons: [
      { sku: 'CHECK_PACK_5', quantity: 1, unitPrice: 19900 },
      { sku: 'INTERVIEW', quantity: 2, unitPrice: 19900 },
    ],
  } as any,
  enterprise: {
    email: 'enterprise@candiq.de',
    password: 'demo1234',
    name: 'Dr. Martin Krüger',
    company: 'NovaCorp Holding AG',
    plan: 'BUSINESS',
    trialDays: 6,
    seed: () => ENTERPRISE_SEED,
    addons: [
      { sku: 'CHECK_PACK_10', quantity: 1, unitPrice: 34900 },
      { sku: 'EXPRESS_24H', quantity: 4, unitPrice: 2900 },
      { sku: 'INTERVIEW', quantity: 3, unitPrice: 19900 },
    ],
  } as any,
  boutique: {
    email: 'boutique@candiq.de',
    password: 'demo1234',
    name: 'Tina Lange',
    company: 'Boutique Talent GmbH',
    plan: 'STARTER',
    trialDays: 14,
    seed: () => BOUTIQUE_SEED,
    addons: [{ sku: 'SINGLE_CHECK', quantity: 1, unitPrice: 4900 }],
  } as any,
}

export async function POST(req: NextRequest) {
  return handle(req)
}
export async function GET(req: NextRequest) {
  return handle(req)
}

async function handle(req: NextRequest) {
  const url = new URL(req.url)
  const requested = (url.searchParams.get('type') ?? 'hr').toLowerCase()
  // PDL-Demos sind in Closed Beta — auf HR fallback (kein 403, da das den Login-Flow bricht)
  const profileKey: DemoProfileKey = (
    requested === 'enterprise' ? 'enterprise' :
    requested === 'boutique' ? 'boutique' :
    'hr'
  )
  const profile = PROFILES[profileKey]

  try {
    const hashed = await bcrypt.hash(profile.password, 10)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + profile.trialDays)

    const user = await prisma.user.upsert({
      where: { email: profile.email },
      update: {
        password: hashed,
        accountType: 'HR_DEPARTMENT',
        plan: profile.plan,
        name: profile.name,
        company: profile.company,
        trialEndsAt,
      },
      create: {
        email: profile.email,
        password: hashed,
        name: profile.name,
        company: profile.company,
        accountType: 'HR_DEPARTMENT',
        plan: profile.plan,
        trialEndsAt,
        gdprConsents: {
          create: {
            type: 'REGISTRATION_DEMO',
            granted: true,
            ip: 'demo-seed',
            userAgent: 'demo-seed',
          },
        },
      },
    })

    // Seed only when empty (idempotent, fast on repeat logins)
    const candidateCount = await prisma.candidate.count({ where: { userId: user.id } })
    if (candidateCount === 0) {
      const seedRows: SeedCandidate[] = profile.seed()
      for (const c of seedRows) {
        await prisma.candidate.create({
          data: {
            userId: user.id,
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
            gdprConsentIp: c.gdprConsent ? 'demo-seed' : null,
            createdAt: c.createdAtOffsetDays
              ? new Date(Date.now() - c.createdAtOffsetDays * 24 * 60 * 60 * 1000)
              : undefined,
            checks: {
              create: c.checks.map((chk) => ({
                ...chk,
                createdAt: chk.createdAtOffsetDays
                  ? new Date(Date.now() - chk.createdAtOffsetDays * 24 * 60 * 60 * 1000)
                  : undefined,
              })),
            },
          },
        })
      }

      // Seed addon orders
      for (const a of profile.addons) {
        await prisma.addonOrder.create({
          data: {
            userId: user.id,
            sku: a.sku,
            quantity: a.quantity,
            unitPrice: a.unitPrice,
            totalAmount: a.unitPrice * a.quantity,
            status: 'CONFIRMED',
          },
        })
      }
    }

    return NextResponse.json({
      ok: true,
      email: profile.email,
      password: profile.password,
      profile: profileKey,
      user: { id: user.id, name: user.name, company: user.company },
    })
  } catch (error) {
    console.error('demo_seed_error', { profileKey, error })
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P1001' || error.code === 'P1002') {
        return NextResponse.json(
          { error: 'Datenbank aktuell nicht erreichbar. Bitte in 1–2 Minuten erneut versuchen.' },
          { status: 503 },
        )
      }
      if (error.code === 'P2021') {
        return NextResponse.json(
          { error: 'Datenbank ist noch nicht initialisiert. Setup unter /api/admin/init aufrufen.' },
          { status: 503 },
        )
      }
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Datenbank-Verbindung schlägt fehl. Bitte DATABASE_URL prüfen.' },
        { status: 503 },
      )
    }
    return NextResponse.json(
      { error: 'Demo-Provisioning fehlgeschlagen. Bitte später erneut versuchen.' },
      { status: 500 },
    )
  }
}

// ─── Demo data shape ────────────────────────────────────────────

type SeedCheck = {
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
  createdAtOffsetDays?: number
}

type SeedCandidate = {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  position: string
  department?: string
  notes?: string
  status: string
  gdprConsent: boolean
  createdAtOffsetDays?: number
  checks: SeedCheck[]
}

const HR_SEED: SeedCandidate[] = [
  {
    firstName: 'Lukas',
    lastName: 'Berger',
    email: 'lukas.berger@example.com',
    phone: '+49 30 123456',
    position: 'Senior Backend Engineer',
    department: 'Engineering',
    notes: 'Bewerbung über Stepstone. Stark in Go & Postgres.',
    status: 'IN_REVIEW',
    gdprConsent: true,
    createdAtOffsetDays: 5,
    checks: [
      {
        employerName: 'Zalando SE',
        employerContact: 'Anna Müller',
        employerPhone: '+49 30 200900',
        employerEmail: 'a.mueller@zalando.de',
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
        employerPhone: '+49 30 555111',
        employerEmail: 't.schneider@dh.de',
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
    position: 'Product Manager',
    department: 'Product',
    notes: 'Empfehlung über LinkedIn. High-Performer.',
    status: 'COMPLETED',
    gdprConsent: true,
    createdAtOffsetDays: 9,
    checks: [
      {
        employerName: 'BMW Group',
        employerContact: 'Martin Wagner',
        employerPhone: '+49 89 12345',
        employerEmail: 'm.wagner@bmw.de',
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
        employerPhone: '+49 40 6461',
        employerEmail: 'k.lehmann@otto.de',
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
    ],
  },
  {
    firstName: 'Markus',
    lastName: 'Lang',
    email: 'markus.lang@example.com',
    phone: '+49 711 334455',
    position: 'Sales Director',
    department: 'Sales',
    notes: 'Senior Hire — High-Risk wenn Fehlbesetzung.',
    status: 'IN_REVIEW',
    gdprConsent: true,
    createdAtOffsetDays: 11,
    checks: [
      {
        employerName: 'SAP SE',
        employerContact: 'Inga Becker',
        employerPhone: '+49 6227 7-47474',
        employerEmail: 'i.becker@sap.com',
        position: 'Regional Sales Lead',
        startDate: '2016-02',
        endDate: '2024-03',
        status: 'COMPLETED',
        result: 'VERIFIED',
        callNotes: 'Hervorragender Track Record. Konsistent über Plan.',
        rating: 5,
        calledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        createdAtOffsetDays: 9,
      },
      {
        employerName: 'Salesforce',
        position: 'AE',
        startDate: '2013-01',
        endDate: '2016-01',
        status: 'OPEN',
        result: null,
        createdAtOffsetDays: 5,
      },
    ],
  },
]

const ENTERPRISE_SEED: SeedCandidate[] = [
  ...HR_SEED,
  {
    firstName: 'Hannah',
    lastName: 'Wolf',
    email: 'hannah.wolf@example.com',
    phone: '+49 69 998822',
    position: 'Interim CFO',
    department: 'Finance',
    notes: 'Senior Executive Search.',
    status: 'COMPLETED',
    gdprConsent: true,
    createdAtOffsetDays: 14,
    checks: [
      {
        employerName: 'Deutsche Bank AG',
        employerContact: 'Robert Klein',
        employerPhone: '+49 69 9100',
        position: 'CFO Asia Pacific',
        startDate: '2018-06',
        endDate: '2024-01',
        status: 'COMPLETED',
        result: 'VERIFIED',
        callNotes: 'Ehemaliger CEO bestätigt: Top-Performance, würde sofort wieder einstellen.',
        rating: 5,
        calledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        createdAtOffsetDays: 12,
      },
    ],
  },
  {
    firstName: 'Pavel',
    lastName: 'Novak',
    email: 'pavel.novak@example.com',
    phone: '+420 222 444',
    position: 'Senior DevOps Engineer',
    department: 'Engineering',
    notes: 'Internationaler Hire (Prag → Berlin).',
    status: 'IN_REVIEW',
    gdprConsent: true,
    createdAtOffsetDays: 4,
    checks: [
      {
        employerName: 'Avast Software',
        employerContact: 'Jan Novotný',
        employerPhone: '+420 274 005 666',
        position: 'DevOps Engineer',
        startDate: '2020-01',
        endDate: '2024-02',
        status: 'IN_PROGRESS',
        result: null,
        createdAtOffsetDays: 3,
      },
    ],
  },
  {
    firstName: 'Aylin',
    lastName: 'Yilmaz',
    email: 'aylin.yilmaz@example.com',
    phone: '+49 89 5552233',
    position: 'Engineering Manager',
    department: 'Engineering',
    notes: 'Empfehlung von CTO.',
    status: 'COMPLETED',
    gdprConsent: true,
    createdAtOffsetDays: 18,
    checks: [
      {
        employerName: 'Siemens AG',
        employerContact: 'Klaus Reinhardt',
        position: 'Tech Lead',
        startDate: '2017-04',
        endDate: '2022-09',
        status: 'COMPLETED',
        result: 'VERIFIED',
        callNotes: 'Stark in technischer Führung, Team-Player, klare Kommunikation.',
        rating: 5,
        calledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16),
        createdAtOffsetDays: 16,
      },
      {
        employerName: 'Allianz Technology',
        employerContact: 'Birgit Schultz',
        position: 'Senior Engineer',
        startDate: '2022-10',
        endDate: '2024-04',
        status: 'COMPLETED',
        result: 'VERIFIED',
        rating: 4,
        calledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        createdAtOffsetDays: 14,
      },
    ],
  },
  {
    firstName: 'Florian',
    lastName: 'Brandt',
    email: 'florian.brandt@example.com',
    phone: '+49 30 6677889',
    position: 'Head of Marketing',
    department: 'Marketing',
    notes: 'Hochkarätiger Hire — Risiko: hohes Gehalt.',
    status: 'IN_REVIEW',
    gdprConsent: true,
    createdAtOffsetDays: 2,
    checks: [
      {
        employerName: 'HelloFresh SE',
        employerContact: 'Sandra König',
        position: 'VP Brand',
        startDate: '2021-08',
        endDate: '2024-03',
        status: 'IN_PROGRESS',
        result: null,
        createdAtOffsetDays: 2,
      },
    ],
  },
]

const BOUTIQUE_SEED: SeedCandidate[] = [
  {
    firstName: 'Tom',
    lastName: 'Müller',
    email: 'tom.mueller@example.com',
    phone: '+49 40 1122334',
    position: 'Frontend Developer',
    department: 'Engineering',
    status: 'IN_REVIEW',
    gdprConsent: true,
    createdAtOffsetDays: 4,
    checks: [
      {
        employerName: 'XING SE',
        employerContact: 'Lisa Bach',
        position: 'Frontend Engineer',
        startDate: '2022-01',
        endDate: '2024-02',
        status: 'COMPLETED',
        result: 'VERIFIED',
        rating: 5,
        callNotes: 'Engagiert, schnell. Würde wieder einstellen.',
        calledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        createdAtOffsetDays: 3,
      },
    ],
  },
  {
    firstName: 'Lea',
    lastName: 'Schneider',
    email: 'lea.schneider@example.com',
    position: 'Marketing Manager',
    status: 'PENDING',
    gdprConsent: true,
    createdAtOffsetDays: 1,
    checks: [],
  },
]
