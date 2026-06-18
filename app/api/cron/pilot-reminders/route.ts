import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { REMINDER_SCHEDULE } from '@/lib/pilotReminderEmails'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Taeglicher Pilot-Reminder-Cron.
 *
 * Auth: Bearer-Token gegen CRON_SECRET. Vercel-Cron schickt den Header
 * automatisch, wenn die Env-Var hinterlegt ist.
 *
 * Workflow:
 *  - Findet alle PilotApplication mit status='PENDING'
 *  - Pro Bewerbung: passender Reminder-Step ist der mit dem groessten
 *    day, für den (createdAt + day) <= now UND (lastReminderSent
 *    < step.day ODER lastReminderSent NULL)
 *  - Sendet die Mail, setzt lastReminderSent + lastReminderAt
 *  - Best-effort: Mail-Fehler stoppen die Schleife nicht, aber werden
 *    geloggt — am nächsten Tag wird der gleiche Step erneut versucht
 *
 * Schreibt am Ende EINEN AuditLog-Eintrag mit Aggregat-Stats.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    logger.error('cron_pilot_reminders_no_secret_configured')
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured on the server' },
      { status: 500 },
    )
  }

  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token || token !== cronSecret) {
    logger.warn('cron_pilot_reminders_unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  // Alle PENDING-Bewerbungen — Filter "lastReminderSent < max(day)"
  // koennten wir SQL-seitig machen, aber bei ~10 Bewerbungen ist die
  // In-Process-Auswertung trivial und einfacher zu debuggen.
  const candidates = await prisma.pilotApplication.findMany({
    where: { status: 'PENDING' },
    select: {
      id: true, firstName: true, company: true, email: true,
      createdAt: true, lastReminderSent: true,
    },
  })

  let sent = 0
  let skipped = 0
  let failed = 0
  const sortedSteps = [...REMINDER_SCHEDULE].sort((a, b) => b.day - a.day)

  for (const c of candidates) {
    const ageDays = Math.floor((now - c.createdAt.getTime()) / dayMs)
    // höchster Step, für den die Bewerbung alt genug ist UND der noch
    // nicht gesendet wurde
    const dueStep = sortedSteps.find(
      (s) => ageDays >= s.day && (c.lastReminderSent ?? 0) < s.day,
    )
    if (!dueStep) {
      skipped++
      continue
    }
    const { subject, html, text } = dueStep.builder({
      firstName: c.firstName,
      company: c.company,
    })
    const r = await sendEmail({ to: c.email, subject, html, text })
    if (!r.ok) {
      failed++
      logger.error('pilot_reminder_send_failed', {
        applicationId: c.id,
        day: dueStep.day,
        reason: r.error,
      })
      continue
    }
    await prisma.pilotApplication.update({
      where: { id: c.id },
      data: { lastReminderSent: dueStep.day, lastReminderAt: new Date() },
    })
    sent++
  }

  // Aggregat-AuditLog (auch bei 0 Sendungen — Beweis dass Cron lief)
  await prisma.auditLog.create({
    data: {
      action: 'PILOT_REMINDERS_CRON',
      entity: 'PilotApplication',
      entityId: null,
      details: JSON.stringify({
        candidates: candidates.length,
        sent,
        skipped,
        failed,
      }),
    },
  }).catch((err) => logger.error('pilot_reminders_audit_log_failed', err))

  logger.info('cron_pilot_reminders_complete', {
    candidates: candidates.length, sent, skipped, failed,
  })

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    sent,
    skipped,
    failed,
  })
}
