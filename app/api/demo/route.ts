import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { DEMO_CREDENTIALS } from '@/lib/utils'

/**
 * One-click demo seed.
 * GET /api/demo
 * POST /api/demo?profile=hr_basic|hr_lead|hr_exec
 *
 * - GET returns DB health + available demo profiles.
 * - POST creates/refreshes demo profile account and seed data.
 * - Idempotently re-seeds a small set of demo candidates + checks so the dashboard never looks empty.
 * - Returns the credentials so the login page can auto-fill and sign in.
 */
export async function POST(req: NextRequest) {
  return handle(req)
}
export async function GET(req: NextRequest) {
  return handle(req)
}

async function handle(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const profileKey = (url.searchParams.get('profile') ?? 'hr_basic') as keyof typeof DEMO_PROFILES

    if (req.method === 'GET') {
      // Lightweight DB health-check for UI status.
      // Keep response non-failing so public pages don't render hard errors.
      let db: 'up' | 'down' = 'up'
      try {
        await prisma.$queryRaw`SELECT 1`
      } catch {
        db = 'down'
      }

      return NextResponse.json({
        ok: db === 'up',
        db,
        profiles: Object.keys(DEMO_PROFILES),
      })
    }

    const selected = DEMO_PROFILES[profileKey] ?? DEMO_PROFILES.hr_basic
    const creds = selected.creds
    const profile = selected.profile

    // 1. Upsert demo user (always reset password so demo always works)
    const hashed = await bcrypt.hash(creds.password, 10)
    const user = await prisma.user.upsert({
      where: { email: creds.email },
      update: {
        password: hashed,
        accountType: profile.accountType,
        plan: profile.plan,
      },
      create: {
        email: creds.email,
        password: hashed,
        name: profile.name,
        company: profile.company,
        accountType: profile.accountType,
        plan: profile.plan,
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

    // 2. Only seed demo data if there are no candidates yet
    const candidateCount = await prisma.candidate.count({ where: { userId: user.id } })

    if (candidateCount === 0) {
      const seedCandidates = selected.seed
      for (const c of seedCandidates) {
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
            checks: {
              create: c.checks,
            },
          },
        })
      }
    }

    return NextResponse.json({
      ok: true,
      email: creds.email,
      password: creds.password,
      profile: profileKey,
      user: { id: user.id, name: user.name, company: user.company },
    })
  } catch (error) {
    console.error('demo_seed_error', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P1001' || error.code === 'P1002') {
        return NextResponse.json(
          { error: 'Datenbank aktuell nicht erreichbar.', db: 'down' },
          { status: 503 }
        )
      }
      if (error.code === 'P2021') {
        return NextResponse.json(
          { error: 'Datenbank noch nicht initialisiert.' },
          { status: 503 }
        )
      }
    }
    return NextResponse.json({ error: 'Demo-Seed fehlgeschlagen.', db: 'unknown' }, { status: 500 })
  }
}

// ─── Demo data ──────────────────────────────────────────────────

const HR_SEED = [
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
    notes: 'Empfehlung über LinkedIn.',
    status: 'COMPLETED',
    gdprConsent: true,
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
        callNotes: 'Position als "Senior Data Scientist" angegeben — laut HR war es "Data Analyst". Andere Angaben korrekt.',
        discrepancies: 'Job-Titel weicht ab (Senior Data Scientist vs. Data Analyst).',
        rating: 3,
        calledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
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
    checks: [
      {
        employerName: 'REWE Digital',
        employerContact: '',
        employerPhone: '',
        employerEmail: '',
        position: 'UX Designer',
        startDate: '2022-04',
        endDate: '2024-04',
        status: 'OPEN',
        result: null,
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
      },
      {
        employerName: 'Salesforce',
        employerContact: '',
        position: 'AE',
        startDate: '2013-01',
        endDate: '2016-01',
        status: 'OPEN',
        result: null,
      },
    ],
  },
]

const DEMO_PROFILES = {
  hr_basic: {
    creds: DEMO_CREDENTIALS.hr_basic,
    profile: {
      name: 'Demo HR Manager',
      company: 'Nordstern GmbH',
      accountType: 'HR_DEPARTMENT',
      plan: 'PROFESSIONAL',
    },
    seed: HR_SEED,
  },
  hr_lead: {
    creds: DEMO_CREDENTIALS.hr_lead,
    profile: {
      name: 'Demo Team Lead Recruiting',
      company: 'RheinTech AG',
      accountType: 'HR_DEPARTMENT',
      plan: 'BUSINESS',
    },
    seed: HR_SEED,
  },
  hr_exec: {
    creds: DEMO_CREDENTIALS.hr_exec,
    profile: {
      name: 'Demo Director People',
      company: 'Hanse Holding SE',
      accountType: 'HR_DEPARTMENT',
      plan: 'ENTERPRISE',
    },
    seed: HR_SEED,
  },
} as const
