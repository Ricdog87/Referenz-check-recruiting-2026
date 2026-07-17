/**
 * scripts/seed-demo.ts  ·  Phase 4 des DD-Auftrags: Demo-Umgebung
 *
 * Legt eine VOLLSTÄNDIG SYNTHETISCHE Demo-Landschaft für Staging/Sales an:
 *   · 3 Beispiel-Kunden (HR-Abteilung, Personaldienstleister, Trial)
 *   · abgeschlossene Referenzprüfungen inkl. eines Diskrepanz-Falls →
 *     jeder COMPLETED-Check rendert live als Report unter
 *     /report/check/<id> (dort „Als PDF speichern / drucken").
 *   · 1 Partner (PartnerAccount, APPROVED, Tier SILVER) mit Endkunden.
 *
 * GARANTIEN (DD-Guardrails):
 *   · KEINE echten personenbezogenen Daten. Alle E-Mails liegen auf der
 *     reservierten, nicht-routbaren TLD `.invalid` (RFC 2606), alle Firmen
 *     tragen den Präfix „[DEMO]". Namen sind erkennbar fiktiv.
 *   · ENV-GUARD: bricht hart ab, wenn das Ziel wie PRODUCTION aussieht
 *     (NEXTAUTH_URL-Host = candiq.de / www.candiq.de). Kein Escape-Hatch.
 *   · IDEMPOTENT: Re-Runs erzeugen keine Duplikate und überschreiben KEINE
 *     bereits gesetzten Passwörter.
 *   · Additiv: legt nur an / frischt auf, löscht nichts Bestehendes.
 *
 * USAGE (nur Staging/lokal):
 *   DATABASE_URL=$STAGING_DATABASE_URL npx tsx scripts/seed-demo.ts
 *   # optional stabiles Login-Passwort über alle Reseeds:
 *   DEMO_SEED_PASSWORD='…' DATABASE_URL=… npx tsx scripts/seed-demo.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { HR_PLANS, AGENCY_PLANS, type Plan } from '../lib/utils'

const prisma = new PrismaClient()

// ── Demo-Marker ───────────────────────────────────────────────────────────
const DEMO_EMAIL_DOMAIN = 'demo.candiq.invalid' // .invalid = garantiert nicht routbar
const DEMO_COMPANY_PREFIX = '[DEMO]'
const DEMO_TAG = 'seed-demo.ts'

const PLAN_BY_ID = new Map<string, Plan>([...HR_PLANS, ...AGENCY_PLANS].map((p) => [p.id, p]))

// ── ENV-Guard: Production hart blocken ────────────────────────────────────
function assertNotProduction(): void {
  const url = process.env.NEXTAUTH_URL ?? ''
  let host = ''
  try {
    host = url ? new URL(url).host.toLowerCase() : ''
  } catch {
    host = ''
  }
  const PROD_HOSTS = new Set(['candiq.de', 'www.candiq.de'])
  if (PROD_HOSTS.has(host)) {
    console.error('')
    console.error('  ⛔  ABBRUCH: Ziel sieht nach PRODUCTION aus (NEXTAUTH_URL-Host = ' + host + ').')
    console.error('      seed-demo.ts ist ausschließlich für Staging/lokal. Kein Prod-Seed.')
    console.error('')
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) {
    console.error('  ⛔  ABBRUCH: DATABASE_URL nicht gesetzt.')
    process.exit(1)
  }
}

// ── Synthetische Datensätze ───────────────────────────────────────────────
type CheckSeed = {
  employerName: string
  employerContact: string
  employerPhone?: string
  employerEmail?: string
  position: string
  startDate: string
  endDate: string
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'FAILED'
  result?: 'VERIFIED' | 'DISCREPANCY_FOUND' | 'UNREACHABLE' | 'DECLINED'
  rating?: number
  callNotes?: string
  discrepancies?: string
  daysAgo?: number
  isExpress?: boolean
}
type CandidateSeed = {
  firstName: string
  lastName: string
  position: string
  department: string
  status: 'PENDING' | 'CONSENT_GIVEN' | 'IN_REVIEW' | 'COMPLETED'
  gdprConsent: boolean
  checks: CheckSeed[]
}
type CustomerSeed = {
  key: string
  name: string
  company: string
  accountType: 'HR_DEPARTMENT' | 'RECRUITMENT_AGENCY'
  plan: string
  planStatus: 'ACTIVE' | 'TRIALING'
  billingInterval: 'MONTHLY' | 'YEARLY' | null
  candidates: CandidateSeed[]
}

function localEmail(local: string): string {
  return `${local}@${DEMO_EMAIL_DOMAIN}`
}

const CUSTOMERS: CustomerSeed[] = [
  {
    key: 'klinikum',
    name: 'Petra Demmler',
    company: `${DEMO_COMPANY_PREFIX} Musterstadt Klinikum gGmbH`,
    accountType: 'HR_DEPARTMENT',
    plan: 'BUSINESS',
    planStatus: 'ACTIVE',
    billingInterval: 'YEARLY',
    candidates: [
      {
        firstName: 'Jonas',
        lastName: 'Demokrat',
        position: 'Oberarzt Kardiologie',
        department: 'Medizin',
        status: 'COMPLETED',
        gdprConsent: true,
        checks: [
          {
            employerName: 'Beispielklinik Nord',
            employerContact: 'Dr. Sample, Chefarzt',
            employerPhone: '+49 30 0000001',
            employerEmail: 'chefarzt@beispielklinik.invalid',
            position: 'Facharzt Kardiologie',
            startDate: '01/2019',
            endDate: '06/2024',
            status: 'COMPLETED',
            result: 'VERIFIED',
            rating: 5,
            callNotes:
              'Alle Stationen und die Facharzt-Qualifikation bestätigt. Führte das Herzkatheterlabor, sehr empfohlen.',
            daysAgo: 4,
          },
        ],
      },
      {
        firstName: 'Sabine',
        lastName: 'Musterfrau',
        position: 'Pflegedienstleitung',
        department: 'Pflege',
        status: 'IN_REVIEW',
        gdprConsent: true,
        checks: [
          {
            employerName: 'Muster-Seniorenzentrum',
            employerContact: 'Herr Beispiel, Heimleitung',
            position: 'Stationsleitung',
            startDate: '03/2016',
            endDate: '02/2024',
            status: 'COMPLETED',
            result: 'VERIFIED',
            rating: 4,
            callNotes: 'Leitungserfahrung und Zeitraum bestätigt.',
            daysAgo: 2,
          },
          {
            employerName: 'Demo-Pflegedienst GmbH',
            employerContact: 'Frau Testfall, PDL',
            position: 'Pflegefachkraft',
            startDate: '08/2012',
            endDate: '02/2016',
            status: 'IN_PROGRESS',
            isExpress: true,
          },
        ],
      },
    ],
  },
  {
    key: 'nordwind',
    name: 'Markus Beispiel',
    company: `${DEMO_COMPANY_PREFIX} Nordwind Personal GmbH`,
    accountType: 'RECRUITMENT_AGENCY',
    plan: 'AGENCY_PRO',
    planStatus: 'ACTIVE',
    billingInterval: 'MONTHLY',
    candidates: [
      {
        firstName: 'Elena',
        lastName: 'Prototyp',
        position: 'Bilanzbuchhalterin',
        department: 'Finance',
        status: 'COMPLETED',
        gdprConsent: true,
        checks: [
          {
            employerName: 'Fiktiv Finanz AG',
            employerContact: 'Herr Muster, Leiter Rechnungswesen',
            employerPhone: '+49 89 0000002',
            employerEmail: 'rw@fiktiv-finanz.invalid',
            position: 'Bilanzbuchhalterin',
            startDate: '05/2020',
            endDate: '04/2025',
            status: 'COMPLETED',
            result: 'DISCREPANCY_FOUND',
            rating: 3,
            callNotes:
              'Tätigkeit im Rechnungswesen bestätigt. Herr Muster stellt jedoch klar, dass die Kandidatin NICHT die Teamleitung innehatte.',
            discrepancies:
              'Position: CV nennt „Leiterin Buchhaltung (5 Mitarbeitende)", Auskunft bestätigt „Bilanzbuchhalterin ohne Personalverantwortung". | Zeitraum: CV 01/2020–04/2025, Auskunft 05/2020–04/2025 (4 Monate Differenz).',
            daysAgo: 1,
          },
        ],
      },
      {
        firstName: 'Ömer',
        lastName: 'Fallstudie',
        position: 'SPS-Programmierer',
        department: 'Engineering',
        status: 'PENDING',
        gdprConsent: false,
        checks: [],
      },
    ],
  },
  {
    key: 'talentbridge',
    name: 'Nadine Platzhalter',
    company: `${DEMO_COMPANY_PREFIX} Talent Bridge AG`,
    accountType: 'HR_DEPARTMENT',
    plan: 'PROFESSIONAL',
    planStatus: 'TRIALING',
    billingInterval: 'MONTHLY',
    candidates: [
      {
        firstName: 'Klara',
        lastName: 'Stichprobe',
        position: 'Marketing Managerin',
        department: 'Marketing',
        status: 'CONSENT_GIVEN',
        gdprConsent: true,
        checks: [
          {
            employerName: 'Demo Media GmbH',
            employerContact: 'Frau Exempel, Head of Marketing',
            position: 'Marketing Managerin',
            startDate: '02/2021',
            endDate: '01/2025',
            status: 'OPEN',
          },
        ],
      },
    ],
  },
]

// 1 Partner mit synthetischen Endkunden.
const PARTNER = {
  key: 'partner-demo',
  email: localEmail('partner'),
  contactFirstName: 'Robert',
  contactLastName: 'Beispielpartner',
  company: `${DEMO_COMPANY_PREFIX} Reseller Solutions GmbH`,
  tier: 'SILVER',
  customers: [
    { company: `${DEMO_COMPANY_PREFIX} Endkunde Alpha GmbH`, contactFirstName: 'Sara', contactLastName: 'Muster', planKey: 'PROFESSIONAL', cycle: 'MONTHLY' as const },
    { company: `${DEMO_COMPANY_PREFIX} Endkunde Beta AG`, contactFirstName: 'Tom', contactLastName: 'Beispiel', planKey: 'STARTER', cycle: 'YEARLY' as const },
    { company: `${DEMO_COMPANY_PREFIX} Endkunde Gamma KG`, contactFirstName: 'Lea', contactLastName: 'Testkunde', planKey: 'BUSINESS', cycle: 'MONTHLY' as const },
  ],
}

// Demo-EK-Rabatt (synthetisch, ~SILVER-Größenordnung). Kein Live-Pricing.
const DEMO_EK_DISCOUNT = 0.2

// ── Helpers ───────────────────────────────────────────────────────────────
function generateRandomPassword(len = 16): string {
  return randomBytes(len).toString('base64url').slice(0, len)
}

function toCents(eur: number): number {
  return Math.round(eur * 100)
}

function listPriceCentsFor(planKey: string, cycle: 'MONTHLY' | 'YEARLY'): number {
  const plan = PLAN_BY_ID.get(planKey)
  if (!plan) return 0
  return toCents(cycle === 'YEARLY' ? plan.priceAnnual : plan.priceMonthly)
}

async function upsertDemoCustomer(c: CustomerSeed): Promise<{ id: string; isNew: boolean; tempPassword?: string }> {
  const email = localEmail(c.key)
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: c.name,
        company: c.company,
        accountType: c.accountType,
        plan: c.plan,
        planStatus: c.planStatus,
        billingInterval: c.billingInterval,
        trialEndsAt: c.planStatus === 'TRIALING' ? new Date(Date.now() + 14 * 86400e3) : null,
        // Bewusst KEINE Stripe-IDs — Demo-Konten sind nie an Billing gebunden.
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      },
    })
    return { id: existing.id, isNew: false }
  }
  const tempPassword = process.env.DEMO_SEED_PASSWORD ?? generateRandomPassword()
  const hashed = await bcrypt.hash(tempPassword, 12)
  const created = await prisma.user.create({
    data: {
      email,
      name: c.name,
      company: c.company,
      password: hashed,
      role: 'CLIENT',
      accountType: c.accountType,
      plan: c.plan,
      planStatus: c.planStatus,
      billingInterval: c.billingInterval,
      trialEndsAt: c.planStatus === 'TRIALING' ? new Date(Date.now() + 14 * 86400e3) : null,
    },
    select: { id: true },
  })
  return { id: created.id, isNew: true, tempPassword }
}

async function seedCandidates(userId: string, candidates: CandidateSeed[]): Promise<{ created: number; reportCheckIds: string[] }> {
  let created = 0
  const reportCheckIds: string[] = []
  for (const cand of candidates) {
    const existing = await prisma.candidate.findFirst({
      where: { userId, firstName: cand.firstName, lastName: cand.lastName },
      select: { id: true },
    })
    let candidateId: string
    if (existing) {
      candidateId = existing.id
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { status: cand.status, gdprConsent: cand.gdprConsent },
      })
    } else {
      const rec = await prisma.candidate.create({
        data: {
          userId,
          firstName: cand.firstName,
          lastName: cand.lastName,
          email: localEmail(`${cand.firstName}.${cand.lastName}`.toLowerCase()),
          position: cand.position,
          department: cand.department,
          status: cand.status,
          gdprConsent: cand.gdprConsent,
          gdprConsentDate: cand.gdprConsent ? new Date() : null,
        },
      })
      candidateId = rec.id
      created++
    }
    for (const chk of cand.checks) {
      const existingCheck = await prisma.referenceCheck.findFirst({
        where: { candidateId, employerName: chk.employerName },
        select: { id: true, status: true, result: true },
      })
      const checkId = existingCheck
        ? existingCheck.id
        : (
            await prisma.referenceCheck.create({
              data: {
                candidateId,
                employerName: chk.employerName,
                employerContact: chk.employerContact,
                employerPhone: chk.employerPhone,
                employerEmail: chk.employerEmail,
                position: chk.position,
                startDate: chk.startDate,
                endDate: chk.endDate,
                status: chk.status,
                result: chk.result,
                rating: chk.rating,
                callNotes: chk.callNotes,
                discrepancies: chk.discrepancies,
                calledAt: chk.daysAgo != null ? new Date(Date.now() - chk.daysAgo * 86400e3) : null,
                isExpress: chk.isExpress ?? false,
                expressActivatedAt: chk.isExpress ? new Date() : null,
              },
              select: { id: true },
            })
          ).id
      if (chk.status === 'COMPLETED') reportCheckIds.push(checkId)
    }
  }
  return { created, reportCheckIds }
}

async function seedPartner(): Promise<{ id: string; isNew: boolean; tempPassword?: string; customers: number }> {
  const existing = await prisma.partnerAccount.findUnique({ where: { email: PARTNER.email }, select: { id: true } })
  let partnerId: string
  let isNew = false
  let tempPassword: string | undefined
  if (existing) {
    partnerId = existing.id
    await prisma.partnerAccount.update({
      where: { id: partnerId },
      data: { status: 'APPROVED', tier: PARTNER.tier, approvedAt: new Date(), emailVerifiedAt: new Date() },
    })
  } else {
    tempPassword = process.env.DEMO_SEED_PASSWORD ?? generateRandomPassword()
    const hashed = await bcrypt.hash(tempPassword, 12)
    const rec = await prisma.partnerAccount.create({
      data: {
        email: PARTNER.email,
        passwordHash: hashed,
        contactFirstName: PARTNER.contactFirstName,
        contactLastName: PARTNER.contactLastName,
        company: PARTNER.company,
        status: 'APPROVED',
        tier: PARTNER.tier,
        approvedAt: new Date(),
        emailVerifiedAt: new Date(),
      },
      select: { id: true },
    })
    partnerId = rec.id
    isNew = true
  }

  let customerCount = 0
  for (const pc of PARTNER.customers) {
    const list = listPriceCentsFor(pc.planKey, pc.cycle)
    const ek = Math.round(list * (1 - DEMO_EK_DISCOUNT))
    const end = list // Partner verkauft zum Listenpreis; Marge = Rabatt.
    const margin = end - ek
    await prisma.partnerCustomer.upsert({
      where: {
        partnerAccountId_company_planKey: {
          partnerAccountId: partnerId,
          company: pc.company,
          planKey: pc.planKey,
        },
      },
      update: { status: 'ACTIVE', billingCycle: pc.cycle, ekPriceCents: ek, endPriceCents: end, marginCents: margin },
      create: {
        partnerAccountId: partnerId,
        company: pc.company,
        contactFirstName: pc.contactFirstName,
        contactLastName: pc.contactLastName,
        contactEmail: localEmail(pc.company.replace(/[^a-z0-9]+/gi, '').toLowerCase()),
        planKey: pc.planKey,
        billingCycle: pc.cycle,
        ekPriceCents: ek,
        endPriceCents: end,
        marginCents: margin,
        status: 'ACTIVE',
      },
    })
    customerCount++
  }
  return { id: partnerId, isNew, tempPassword, customers: customerCount }
}

async function writeAudit(action: string, entity: string, entityId: string, details: string): Promise<void> {
  await prisma.auditLog.create({ data: { action, entity, entityId, details } })
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  assertNotProduction()

  console.log('')
  console.log('═════════════════════════════════════════════════════════════')
  console.log('  candiq · seed-demo.ts — synthetische Demo-Umgebung')
  console.log('═════════════════════════════════════════════════════════════')
  console.log(`  Ziel:     ${process.env.NEXTAUTH_URL ?? 'localhost'} (Staging/lokal)`)
  console.log(`  Marker:   E-Mails @${DEMO_EMAIL_DOMAIN} · Firmen „${DEMO_COMPANY_PREFIX} …"`)
  console.log('─────────────────────────────────────────────────────────────')

  const reportLinks: string[] = []
  let newAccounts = 0
  const passwords: string[] = []

  for (const c of CUSTOMERS) {
    const u = await upsertDemoCustomer(c)
    if (u.isNew) {
      newAccounts++
      if (u.tempPassword) passwords.push(`${localEmail(c.key)} → ${u.tempPassword}`)
    }
    await writeAudit('DEMO_SEED', 'User', u.id, `${u.isNew ? 'Erstellt' : 'Aktualisiert'} · ${c.company} · plan=${c.plan}/${c.planStatus} · ${DEMO_TAG}`)
    const res = await seedCandidates(u.id, c.candidates)
    reportLinks.push(...res.reportCheckIds)
    console.log(`  ${u.isNew ? '✓ neu ' : '↻ frisch'}  ${c.company}  ·  Kandidaten +${res.created}  ·  Reports ${res.reportCheckIds.length}`)
  }

  const p = await seedPartner()
  if (p.isNew && p.tempPassword) passwords.push(`${PARTNER.email} (Partner) → ${p.tempPassword}`)
  await writeAudit('DEMO_SEED', 'PartnerAccount', p.id, `${p.isNew ? 'Erstellt' : 'Aktualisiert'} · ${PARTNER.company} · tier=${PARTNER.tier} · Endkunden=${p.customers} · ${DEMO_TAG}`)
  console.log(`  ${p.isNew ? '✓ neu ' : '↻ frisch'}  ${PARTNER.company} (Partner, ${PARTNER.tier})  ·  Endkunden ${p.customers}`)

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  console.log('')
  console.log('═════════════════════════════════════════════════════════════')
  console.log('  ✅ FERTIG — Demo-Umgebung bereit')
  console.log('═════════════════════════════════════════════════════════════')
  console.log(`  Neue Konten:      ${newAccounts} (Re-Runs überschreiben keine Passwörter)`)
  if (passwords.length) {
    console.log('  Login-Passwörter (nur bei Erst-Anlage angezeigt):')
    for (const line of passwords) console.log(`   · ${line}`)
    if (!process.env.DEMO_SEED_PASSWORD)
      console.log('   (Tipp: DEMO_SEED_PASSWORD setzen für stabile Logins über Reseeds.)')
  }
  console.log('  Beispiel-Reports (COMPLETED-Checks, „Als PDF speichern / drucken"):')
  for (const id of reportLinks) console.log(`   · ${baseUrl}/report/check/${id}`)
  console.log('═════════════════════════════════════════════════════════════')
}

main()
  .catch((err) => {
    console.error('')
    console.error('❌ FEHLER:')
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
