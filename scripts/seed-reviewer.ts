/**
 * scripts/seed-reviewer.ts
 *
 * Legt einen Login fuer das candiq-Reviewer-Team an. Reviewer arbeiten
 * workspace-uebergreifend (siehe lib/reviewer.ts + app/(dashboard)/reviewer/**) —
 * sie sehen ALLE eingehenden Pruefungen mit status='IN_REVIEW' in einer Queue.
 *
 * Default: ein Pool-Account `reviewer@candiq.de`, an dem mehrere Reviewer
 * gemeinsam arbeiten koennen. Zusaetzliche Konten via PROSPECT-Registry-Pattern.
 *
 * Idempotent: ueberschreibt KEIN bestehendes Passwort; refresht nur die Rolle
 * (z.B. um einen User von CLIENT auf REVIEWER zu promoten) und gibt einen
 * frischen Reset-Link aus.
 *
 * USAGE:
 *   # Pool-Account (Default):
 *   DATABASE_URL=$PROD_DATABASE_URL NEXTAUTH_URL=https://candiq.de \
 *     npx tsx scripts/seed-reviewer.ts
 *
 *   # Individueller Reviewer (PROSPECT_KEY-Stil):
 *   REVIEWER_KEY=ricardo \
 *     DATABASE_URL=$PROD_DATABASE_URL NEXTAUTH_URL=https://candiq.de \
 *     npx tsx scripts/seed-reviewer.ts
 *
 *   # Ad-hoc via Env (einmaliger Spike):
 *   REVIEWER_EMAIL=foo@candiq.de REVIEWER_NAME="Foo Bar" \
 *     DATABASE_URL=… NEXTAUTH_URL=… npx tsx scripts/seed-reviewer.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes, createHash } from 'crypto'

const prisma = new PrismaClient()

// ── Reviewer-Registry ───────────────────────────────────────────────────
type ReviewerProfile = {
  name: string
  email: string
  // role gesteuert ueber REVIEWER (Queue + PATCH) oder ADMIN (alles).
  role: 'REVIEWER' | 'ADMIN'
}

const REVIEWERS: Record<string, ReviewerProfile> = {
  // Gemeinsamer Pool-Account fuer das Reviewer-Team. Mehrere Personen
  // teilen sich diesen Login — die Queue ist die geteilte Inbox.
  team: {
    name: 'candiq Reviewer-Team',
    email: 'reviewer@candiq.de',
    role: 'REVIEWER',
  },
  // Founder mit Vollzugriff (sieht auch User-Verwaltung etc.).
  ricardo: {
    name: 'Ricardo Serrano',
    email: 'r.serrano@recruiting-sg.de',
    role: 'ADMIN',
  },
}

const REVIEWER_KEY = (process.env.REVIEWER_KEY ?? 'team').toLowerCase()
const REGISTRY_PROFILE = REVIEWERS[REVIEWER_KEY]

if (!REGISTRY_PROFILE && !process.env.REVIEWER_EMAIL) {
  console.error(
    `❌ Unbekannter REVIEWER_KEY="${REVIEWER_KEY}". Verfuegbar: ${Object.keys(REVIEWERS).join(', ')}`,
  )
  console.error(
    '   Alternativ REVIEWER_EMAIL/REVIEWER_NAME/REVIEWER_ROLE explizit setzen.',
  )
  process.exit(1)
}

const REVIEWER_EMAIL = (process.env.REVIEWER_EMAIL ?? REGISTRY_PROFILE!.email).toLowerCase()
const REVIEWER_NAME = process.env.REVIEWER_NAME ?? REGISTRY_PROFILE!.name
const REVIEWER_ROLE =
  (process.env.REVIEWER_ROLE as 'REVIEWER' | 'ADMIN' | undefined) ?? REGISTRY_PROFILE!.role

const RESET_TOKEN_TTL_DAYS = 14

function generateRandomPassword(len = 16): string {
  return randomBytes(len).toString('base64url').slice(0, len)
}
function makeResetToken() {
  const raw = randomBytes(32).toString('base64url')
  const hash = createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

async function upsertReviewerUser() {
  const existing = await prisma.user.findUnique({
    where: { email: REVIEWER_EMAIL },
    select: { id: true, role: true, email: true },
  })

  if (existing) {
    // Re-Run: Rolle hochziehen, Passwort UNANGETASTET lassen.
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: REVIEWER_NAME,
        role: REVIEWER_ROLE,
        company: 'candiq',
        accountType: 'HR_DEPARTMENT',
        // Reviewer-Konto braucht keinen Billing-Plan — wir setzen ENTERPRISE/ACTIVE
        // ohne Stripe-Anbindung, damit Dashboard-Routen nicht meckern.
        plan: 'ENTERPRISE',
        planStatus: 'ACTIVE',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        billingInterval: null,
        trialEndsAt: null,
      },
      select: { id: true, email: true, role: true },
    })
    return { user: updated, isNew: false, previousRole: existing.role }
  }

  const tempPassword = generateRandomPassword()
  const hashed = await bcrypt.hash(tempPassword, 12)

  const created = await prisma.user.create({
    data: {
      email: REVIEWER_EMAIL,
      name: REVIEWER_NAME,
      company: 'candiq',
      password: hashed,
      role: REVIEWER_ROLE,
      accountType: 'HR_DEPARTMENT',
      plan: 'ENTERPRISE',
      planStatus: 'ACTIVE',
      billingInterval: null,
    },
    select: { id: true, email: true, role: true },
  })
  return { user: created, isNew: true, tempPassword, previousRole: null }
}

async function createFreshResetToken(userId: string) {
  const { raw, hash } = makeResetToken()
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_DAYS * 86400e3)
  await prisma.passwordResetToken.create({ data: { userId, token: hash, expiresAt } })
  return { raw, expiresAt }
}

async function writeAuditEntry(userId: string, isNew: boolean, previousRole: string | null) {
  const changed = !isNew && previousRole !== REVIEWER_ROLE
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'REVIEWER_ACCESS_GRANTED',
      entity: 'User',
      entityId: userId,
      details: [
        isNew ? 'Erstellt' : 'Aktualisiert',
        `Role=${REVIEWER_ROLE}${changed ? ` (vorher: ${previousRole})` : ''}`,
        'Seed via scripts/seed-reviewer.ts',
      ].join(' · '),
    },
  })
}

async function main() {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const isProd = baseUrl.includes('candiq.de')

  console.log('')
  console.log('═════════════════════════════════════════════════════════════')
  console.log('  candiq · seed-reviewer.ts')
  console.log('═════════════════════════════════════════════════════════════')
  console.log(`  Target Environment: ${isProd ? 'PRODUCTION (candiq.de)' : 'Local/Staging'}`)
  console.log(`  Reviewer:           ${REVIEWER_NAME} <${REVIEWER_EMAIL}>`)
  console.log(`  Role:               ${REVIEWER_ROLE}`)
  console.log('─────────────────────────────────────────────────────────────')
  console.log('')

  if (isProd) {
    console.log('  ⚠  Production-Modus erkannt. Schreibe in 2s…')
    await new Promise((r) => setTimeout(r, 2000))
  }

  const result = await upsertReviewerUser()
  console.log(
    `  ${result.isNew ? '✓ Created' : '↻ Refreshed'} User · id=${result.user.id} · role=${result.user.role}`,
  )
  if (!result.isNew && result.previousRole && result.previousRole !== REVIEWER_ROLE) {
    console.log(`     (Rolle hochgesetzt: ${result.previousRole} → ${REVIEWER_ROLE})`)
  }

  await writeAuditEntry(result.user.id, result.isNew, result.previousRole)
  console.log(`  ✓ AuditLog: REVIEWER_ACCESS_GRANTED`)

  const tok = await createFreshResetToken(result.user.id)
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(tok.raw)}`
  const expISO = tok.expiresAt.toISOString().slice(0, 16).replace('T', ' ')
  console.log(`  ✓ PasswordResetToken · expiresAt=${expISO} (UTC, ${RESET_TOKEN_TTL_DAYS}d)`)

  console.log('')
  console.log('═════════════════════════════════════════════════════════════')
  console.log('  ✅ FERTIG — Zugang fuer Reviewer-Team')
  console.log('═════════════════════════════════════════════════════════════')
  console.log('')
  console.log(`  Login-URL:        ${baseUrl}/login`)
  console.log(`  Reviewer-Queue:   ${baseUrl}/reviewer/queue`)
  console.log(`  E-Mail:           ${REVIEWER_EMAIL}`)
  if (result.isNew && result.tempPassword) {
    console.log(`  Initial-Passwort: ${result.tempPassword}`)
    console.log(`                    (Funktioniert sofort. Reset-Link unten ist`)
    console.log(`                     die empfohlene Methode.)`)
  } else {
    console.log(`  Initial-Passwort: — (Account existierte bereits, bestehendes`)
    console.log(`                       Passwort unangetastet.)`)
  }
  console.log('')
  console.log(`  Password-Reset-Link (${RESET_TOKEN_TTL_DAYS} Tage gueltig):`)
  console.log(`  ${resetUrl}`)
  console.log('')
  console.log('  Was der Reviewer-Account sieht:')
  console.log('   · Alle Pruefungen mit Status IN_REVIEW (workspace-uebergreifend)')
  console.log('   · Pro Eintrag: Kunde (Company), Kandidat, Position, Arbeitgeber, Kontakt')
  console.log('   · FIFO-Sortierung (aelteste zuerst) — SLA-Ziel 24h')
  console.log('   · Detail-View: callNotes / discrepancies / rating / result speichern')
  console.log('   · "Freigeben" triggert PDF-Report + Mail an HR-Kunde')
  console.log('')
  console.log('  E-Mail-Benachrichtigung bei neuen Pruefungen:')
  console.log(`   Env-Var REVIEWER_NOTIFICATION_EMAIL (default hello@candiq.de)`)
  console.log(`   Komma-separierte Liste fuer mehrere Empfaenger moeglich.`)
  console.log('')
  console.log('═════════════════════════════════════════════════════════════')
}

main()
  .catch((err) => {
    console.error('❌ seed-reviewer.ts failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
