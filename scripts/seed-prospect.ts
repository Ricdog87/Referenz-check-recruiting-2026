/**
 * scripts/seed-prospect.ts
 *
 * Legt einen persoenlichen Test-/Comp-Account fuer einen Sales-Prospect an.
 * Idempotent: kann mehrfach ausgefuehrt werden, ohne Duplikate zu erzeugen.
 * Ueberschreibt KEIN existierendes Passwort — falls der User sich bereits
 * eingeloggt hat, bleibt sein Passwort unangetastet; ein neuer Reset-Link
 * wird trotzdem ausgegeben.
 *
 * REALITY-CHECK gegen das aktuelle Schema:
 *  - candiq nutzt NextAuth Credentials (bcrypt), KEINE Supabase Auth.
 *  - candiq ist single-tenant: jeder `User` IST ein "Workspace".
 *  - Comp-Markierung: plan=ENTERPRISE + planStatus=ACTIVE + Stripe-IDs=null
 *  - Reports werden on-demand aus ReferenceCheck-Records gerendert.
 *
 * USAGE:
 *   # Andre Sola (APSCo) — Default:
 *   DATABASE_URL=$PROD_DATABASE_URL NEXTAUTH_URL=https://candiq.de \
 *     npx tsx scripts/seed-prospect.ts
 *
 *   # Oliver Saul (Index Gruppe):
 *   PROSPECT_KEY=oliver \
 *     DATABASE_URL=$PROD_DATABASE_URL NEXTAUTH_URL=https://candiq.de \
 *     npx tsx scripts/seed-prospect.ts
 *
 *   # Ad-hoc-Prospect via Env (fuer Onetime-Spike):
 *   PROSPECT_EMAIL=foo@bar.com PROSPECT_NAME="Foo Bar" \
 *     PROSPECT_COMPANY=Bar PROSPECT_WORKSPACE="Bar – Testzugang" \
 *     DATABASE_URL=… NEXTAUTH_URL=… \
 *     npx tsx scripts/seed-prospect.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes, createHash } from 'crypto'

const prisma = new PrismaClient()

// ── Prospect-Registry ───────────────────────────────────────────────────
// Eingebaute Prospects per PROSPECT_KEY. Default ist 'andre' (rueckwaerts-
// kompatibel zu den ersten Runs). Neuer Prospect? Eintrag hier ergaenzen.
type ProspectProfile = {
  name: string
  email: string
  company: string
  workspaceName: string
}

const PROSPECTS: Record<string, ProspectProfile> = {
  andre: {
    name: 'André Sola',
    email: 'andre.sola@apsco.org',
    company: 'APSCo',
    workspaceName: 'APSCo – Testzugang (André Sola)',
  },
  oliver: {
    name: 'Oliver Saul',
    email: 'o.saul@index.de',
    company: 'Index Gruppe',
    workspaceName: 'Index Gruppe – Testzugang (Oliver Saul)',
  },
}

const PROSPECT_KEY = (process.env.PROSPECT_KEY ?? 'andre').toLowerCase()
const REGISTRY_PROFILE = PROSPECTS[PROSPECT_KEY]

if (!REGISTRY_PROFILE && !process.env.PROSPECT_EMAIL) {
  console.error(
    `❌ Unbekannter PROSPECT_KEY="${PROSPECT_KEY}". Verfuegbar: ${Object.keys(PROSPECTS).join(', ')}`,
  )
  console.error(
    '   Alternativ alle PROSPECT_EMAIL/NAME/COMPANY/WORKSPACE-Env-Vars explizit setzen.',
  )
  process.exit(1)
}

// Env-Vars haben Vorrang vor Registry (fuer Ad-hoc-Overrides).
const PROSPECT_EMAIL = process.env.PROSPECT_EMAIL ?? REGISTRY_PROFILE!.email
const PROSPECT_NAME = process.env.PROSPECT_NAME ?? REGISTRY_PROFILE!.name
const PROSPECT_COMPANY = process.env.PROSPECT_COMPANY ?? REGISTRY_PROFILE!.company
const PROSPECT_WORKSPACE_NAME =
  process.env.PROSPECT_WORKSPACE ?? REGISTRY_PROFILE!.workspaceName

// Reset-Token: 14 Tage gueltig, sodass der Prospect sich in Ruhe einloggen kann.
const RESET_TOKEN_TTL_DAYS = 14

// ── Demo-Daten (fiktiv, aus Pitch-Deck konsistent) ──────────────────────
type CandidateSeed = {
  firstName: string
  lastName: string
  email: string
  position: string
  department: string
  status:
    | 'PENDING'
    | 'CONSENT_GIVEN'
    | 'IN_REVIEW'
    | 'COMPLETED'
    | 'CONSENT_REVOKED'
    | 'REJECTED'
  gdprConsent: boolean
  checks: CheckSeed[]
}
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
  calledAt?: Date
}

const PROSPECT_CANDIDATES: CandidateSeed[] = [
  {
    firstName: 'Anna',
    lastName: 'Mustermann',
    email: 'anna.mustermann@example.com',
    position: 'Senior Backend Engineer',
    department: 'Engineering',
    status: 'COMPLETED',
    gdprConsent: true,
    checks: [
      {
        employerName: 'Beispiel AG',
        employerContact: 'Frau Schmidt, Head of Engineering',
        employerPhone: '+49 89 12345678',
        employerEmail: 'schmidt@beispiel-ag.example',
        position: 'Senior Backend Engineer',
        startDate: '03/2020',
        endDate: '12/2023',
        status: 'COMPLETED',
        result: 'VERIFIED',
        rating: 5,
        callNotes:
          'Frau Schmidt bestaetigt alle Stationen und Taetigkeiten wie im CV angegeben. Anna war fuehrend bei der Microservices-Migration und hat ein 4-koepfiges Team gementort. Empfehlung ohne Vorbehalt.',
        calledAt: new Date(Date.now() - 5 * 86400e3),
      },
      {
        employerName: 'TechCorp GmbH',
        employerContact: 'Herr Weber, CTO',
        employerEmail: 'weber@techcorp.example',
        position: 'Backend Engineer',
        startDate: '06/2017',
        endDate: '02/2020',
        status: 'COMPLETED',
        result: 'VERIFIED',
        rating: 4,
        callNotes:
          'Position und Zeitraum bestaetigt. Solide Engineering-Leistung, hat das Payment-Modul mitentwickelt. Verlaesslich, gut im Team.',
        calledAt: new Date(Date.now() - 6 * 86400e3),
      },
      {
        employerName: 'StartUp AG',
        employerContact: 'Frau Klein, Co-Founder',
        position: 'Junior Developer',
        startDate: '09/2015',
        endDate: '05/2017',
        status: 'COMPLETED',
        result: 'VERIFIED',
        rating: 4,
        callNotes: 'Erste Station, hat sich schnell von Junior zu Mid-Level entwickelt.',
        calledAt: new Date(Date.now() - 7 * 86400e3),
      },
    ],
  },
  {
    firstName: 'Max',
    lastName: 'Probemann',
    email: 'max.probemann@example.com',
    position: 'Product Manager',
    department: 'Growth',
    status: 'COMPLETED',
    gdprConsent: true,
    checks: [
      {
        employerName: 'BeispielTech GmbH',
        employerContact: 'Frau Müller, Director PM',
        employerPhone: '+49 89 9876543',
        employerEmail: 'mueller@beispieltech.example',
        position: 'Mid-Level Product Manager',
        startDate: '04/2022',
        endDate: '08/2024',
        status: 'COMPLETED',
        result: 'DISCREPANCY_FOUND',
        rating: 3,
        callNotes:
          'Tätigkeiten Produktstrategie und Roadmap-Management bestätigt. Empfehlung als "solide arbeitend" ausgesprochen. Frau Müller betont, dass Max NICHT in Lead-Funktion war und keine direkten Reports hatte — er war Mid-Level PM im 6-koepfigen Produkt-Team.',
        discrepancies:
          'Position: CV nennt "Senior Product Manager (Lead, 4 direkte Reports)", Auskunft bestätigt "Mid-Level Product Manager, keine direkten Reports". | Zeitraum: CV nennt 01/2022 – 08/2024 (32 Monate), Auskunft bestätigt 04/2022 – 08/2024 (29 Monate). Diskrepanz von 3 Monaten.',
        calledAt: new Date(Date.now() - 3 * 86400e3),
      },
      {
        employerName: 'ProductHaus AG',
        employerContact: 'Herr Brunner, Head of Product',
        position: 'Associate Product Manager',
        startDate: '08/2019',
        endDate: '12/2021',
        status: 'COMPLETED',
        result: 'VERIFIED',
        rating: 3,
        callNotes:
          'Position und Zeitraum stimmen mit CV. Solide Einstiegsleistung als APM.',
        calledAt: new Date(Date.now() - 4 * 86400e3),
      },
    ],
  },
  {
    firstName: 'Lina',
    lastName: 'Kandidat',
    email: 'lina.kandidat@example.com',
    position: 'Senior Sales Lead',
    department: 'Sales',
    status: 'IN_REVIEW',
    gdprConsent: true,
    checks: [
      {
        employerName: 'SalesPro GmbH',
        employerContact: 'Frau Becker, VP Sales',
        employerPhone: '+49 30 5551122',
        position: 'Senior Sales Lead',
        startDate: '05/2021',
        endDate: '03/2025',
        status: 'COMPLETED',
        result: 'VERIFIED',
        rating: 5,
        callNotes:
          'Frau Becker bestaetigt Position und Top-Performance. Lina hat 130% der Quote uebertroffen und 3 Junior-Reps gementort.',
        calledAt: new Date(Date.now() - 2 * 86400e3),
      },
      {
        employerName: 'Vertrieb GmbH',
        employerContact: 'Herr Lang, Sales Director',
        position: 'Account Executive',
        startDate: '03/2018',
        endDate: '04/2021',
        status: 'IN_PROGRESS',
      },
      {
        employerName: 'StartSales AG',
        employerContact: 'Frau Köhler, Founder',
        position: 'SDR',
        startDate: '07/2016',
        endDate: '02/2018',
        status: 'OPEN',
      },
    ],
  },
  {
    firstName: 'Tim',
    lastName: 'Beispiel',
    email: 'tim.beispiel@example.com',
    position: 'UX Researcher',
    department: 'Design',
    status: 'PENDING',
    gdprConsent: false,
    checks: [],
  },
]

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

function generateRandomPassword(len = 16): string {
  // url-safe random — vermeidet Sonderzeichen, die User-Probleme machen
  return randomBytes(len).toString('base64url').slice(0, len)
}

function makeResetToken() {
  const raw = randomBytes(32).toString('base64url')
  const hash = createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

async function upsertProspectUser() {
  const existing = await prisma.user.findUnique({
    where: { email: PROSPECT_EMAIL.toLowerCase() },
    select: { id: true, email: true, password: true, plan: true, planStatus: true, createdAt: true },
  })

  if (existing) {
    // Erneuter Run: NICHT das Passwort ueberschreiben (User koennte sich
    // schon eingeloggt + eigenes Passwort gesetzt haben). Nur die Plan-
    // Felder auf-frischen, damit Comp-Status aktiv bleibt.
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: PROSPECT_NAME,
        company: PROSPECT_COMPANY,
        accountType: 'HR_DEPARTMENT',
        plan: 'ENTERPRISE',
        planStatus: 'ACTIVE',
        billingInterval: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
        trialEndsAt: null,
      },
      select: { id: true, email: true, createdAt: true },
    })
    return { user: updated, isNew: false }
  }

  // Neuer User: random Initialpasswort. Wird auch im Output ausgegeben,
  // aber der Reset-Link ist die empfohlene Methode.
  const tempPassword = generateRandomPassword()
  const hashed = await bcrypt.hash(tempPassword, 12)

  const created = await prisma.user.create({
    data: {
      email: PROSPECT_EMAIL.toLowerCase(),
      name: PROSPECT_NAME,
      company: PROSPECT_COMPANY,
      password: hashed,
      role: 'CLIENT',
      accountType: 'HR_DEPARTMENT',
      plan: 'ENTERPRISE',
      planStatus: 'ACTIVE',
      // Bewusst KEINE Stripe-IDs — markiert das Konto als Comp/Sales-Access.
      billingInterval: null,
    },
    select: { id: true, email: true, createdAt: true },
  })

  return { user: created, isNew: true, tempPassword }
}

async function seedCandidatesAndChecks(userId: string) {
  let createdC = 0
  let updatedC = 0
  let createdCh = 0
  let maxProbemannCheckId: string | null = null

  for (const c of PROSPECT_CANDIDATES) {
    // Idempotenz: Match auf (userId, firstName, lastName).
    const existing = await prisma.candidate.findFirst({
      where: { userId, firstName: c.firstName, lastName: c.lastName },
      select: { id: true },
    })

    let candidateId: string
    if (existing) {
      candidateId = existing.id
      // Status leicht aktualisieren (falls vorherige Run-Daten alt sind),
      // aber NICHT andere Felder ueberschreiben.
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { status: c.status, gdprConsent: c.gdprConsent },
      })
      updatedC++
    } else {
      const created = await prisma.candidate.create({
        data: {
          userId,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          position: c.position,
          department: c.department,
          status: c.status,
          gdprConsent: c.gdprConsent,
          gdprConsentDate: c.gdprConsent ? new Date() : null,
        },
      })
      candidateId = created.id
      createdC++
    }

    for (const chk of c.checks) {
      const existingCheck = await prisma.referenceCheck.findFirst({
        where: { candidateId, employerName: chk.employerName },
        select: { id: true },
      })
      if (existingCheck) {
        if (c.firstName === 'Max' && c.lastName === 'Probemann' && chk.result === 'DISCREPANCY_FOUND') {
          maxProbemannCheckId = existingCheck.id
        }
        continue
      }
      const created = await prisma.referenceCheck.create({
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
          calledAt: chk.calledAt,
        },
      })
      createdCh++
      if (c.firstName === 'Max' && c.lastName === 'Probemann' && chk.result === 'DISCREPANCY_FOUND') {
        maxProbemannCheckId = created.id
      }
    }
  }

  return { createdC, updatedC, createdCh, maxProbemannCheckId }
}

async function createFreshResetToken(userId: string) {
  const { raw, hash } = makeResetToken()
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_DAYS * 86400e3)
  await prisma.passwordResetToken.create({
    data: { userId, token: hash, expiresAt },
  })
  return { raw, expiresAt }
}

async function writeAuditEntry(userId: string, isNew: boolean) {
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'PROSPECT_COMP_ACCESS',
      entity: 'User',
      entityId: userId,
      details: `${isNew ? 'Erstellt' : 'Aktualisiert'} · Workspace: ${PROSPECT_WORKSPACE_NAME} · Plan: ENTERPRISE (kein Stripe-Billing) · Seed via scripts/seed-prospect.ts`,
    },
  })
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────

async function main() {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const isProd = baseUrl.includes('candiq.de')

  console.log('')
  console.log('═════════════════════════════════════════════════════════════')
  console.log('  candiq · seed-prospect.ts')
  console.log('═════════════════════════════════════════════════════════════')
  console.log(`  Target Environment: ${isProd ? 'PRODUCTION (candiq.de)' : 'Local/Staging'}`)
  console.log(`  Prospect:           ${PROSPECT_NAME} <${PROSPECT_EMAIL}>`)
  console.log(`  Company:            ${PROSPECT_COMPANY}`)
  console.log(`  Workspace-Label:    ${PROSPECT_WORKSPACE_NAME}`)
  console.log('─────────────────────────────────────────────────────────────')
  console.log('')

  if (isProd) {
    // 2-Sekunden-Bedenkzeit fuer Production-Runs.
    console.log('  ⚠  Production-Modus erkannt. Schreibe in 2s…')
    await new Promise((r) => setTimeout(r, 2000))
  }

  // 1) User anlegen / refreshen
  const userResult = await upsertProspectUser()
  console.log(
    `  ${userResult.isNew ? '✓ Created' : '↻ Refreshed'} User · id=${userResult.user.id}`,
  )

  // 2) Audit-Eintrag
  await writeAuditEntry(userResult.user.id, userResult.isNew)
  console.log(`  ✓ AuditLog: PROSPECT_COMP_ACCESS`)

  // 3) Kandidaten + Checks
  const seedResult = await seedCandidatesAndChecks(userResult.user.id)
  console.log(
    `  ✓ Candidates · neu=${seedResult.createdC} aktualisiert=${seedResult.updatedC}`,
  )
  console.log(`  ✓ ReferenceChecks neu=${seedResult.createdCh}`)

  // 4) Frischen Reset-Token erzeugen (immer, 14d TTL)
  const tok = await createFreshResetToken(userResult.user.id)
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(tok.raw)}`
  const expISO = tok.expiresAt.toISOString().slice(0, 16).replace('T', ' ')
  console.log(`  ✓ PasswordResetToken · expiresAt=${expISO} (UTC, ${RESET_TOKEN_TTL_DAYS}d)`)

  // ── Output ────────────────────────────────────────────────────────────
  console.log('')
  console.log('═════════════════════════════════════════════════════════════')
  console.log('  ✅ FERTIG — Daten zum Weiterleiten an den Prospect')
  console.log('═════════════════════════════════════════════════════════════')
  console.log('')
  console.log(`  Workspace-Name:   ${PROSPECT_WORKSPACE_NAME}`)
  console.log(`  Workspace-ID:     ${userResult.user.id}`)
  console.log(`  Login-URL:        ${baseUrl}/login`)
  console.log(`  E-Mail:           ${PROSPECT_EMAIL}`)
  if (userResult.isNew && userResult.tempPassword) {
    console.log(`  Initial-Passwort: ${userResult.tempPassword}`)
    console.log(`                    (Funktioniert sofort. Reset-Link unten`)
    console.log(`                     ist die empfohlene Methode.)`)
  } else {
    console.log(`  Initial-Passwort: — (Account existierte bereits; eigenes`)
    console.log(`                       Passwort des Users unangetastet)`)
  }
  console.log('')
  console.log(`  Password-Reset-Link (${RESET_TOKEN_TTL_DAYS} Tage gueltig, EMPFOHLEN):`)
  console.log(`  ${resetUrl}`)
  console.log('')
  console.log('  Demo-Daten im Konto:')
  for (const c of PROSPECT_CANDIDATES) {
    const checkCount = c.checks.length
    const checkText = checkCount === 0 ? 'kein Check' : `${checkCount} Check${checkCount > 1 ? 's' : ''}`
    console.log(`   · ${c.firstName} ${c.lastName} – ${c.position} – ${c.status} (${checkText})`)
  }
  console.log('')
  if (seedResult.maxProbemannCheckId) {
    console.log('  Direktlink Max-Probemann Diskrepanz-Report:')
    console.log(`  ${baseUrl}/report/check/${seedResult.maxProbemannCheckId}`)
    console.log('  (öffnet sich erst nach Login. Falls Andre nicht direkt')
    console.log('   eingeloggt ist, bringt der Login-Flow ihn dorthin zurueck.)')
  }
  console.log('')
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
