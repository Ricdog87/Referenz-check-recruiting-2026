import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail, reviewerHandoffNotificationEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'FAILED']
const VALID_RESULTS = ['VERIFIED', 'DISCREPANCY_FOUND', 'UNREACHABLE', 'DECLINED']
const MAX_NOTES_LEN = 5000

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const check = await prisma.referenceCheck.findFirst({
    where: { id: params.id, candidate: { userId: session.user.id } },
    include: {
      candidate: {
        select: {
          firstName: true,
          lastName: true,
          position: true,
          user: { select: { id: true, name: true, email: true, company: true } },
        },
      },
    },
  })
  if (!check) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  if (body.status !== undefined) {
    const status = String(body.status)
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Ungültiger Status.' }, { status: 400 })
    }
    data.status = status
  }

  if (body.result !== undefined) {
    const result = body.result === null || body.result === '' ? null : String(body.result)
    if (result !== null && !VALID_RESULTS.includes(result)) {
      return NextResponse.json({ error: 'Ungültiges Ergebnis.' }, { status: 400 })
    }
    data.result = result
  }

  if (body.callNotes !== undefined) {
    const callNotes = body.callNotes === null ? null : String(body.callNotes)
    if (callNotes !== null && callNotes.length > MAX_NOTES_LEN) {
      return NextResponse.json({ error: `Notizen dürfen maximal ${MAX_NOTES_LEN} Zeichen haben.` }, { status: 400 })
    }
    data.callNotes = callNotes
  }

  if (body.discrepancies !== undefined) {
    const discrepancies = body.discrepancies === null ? null : String(body.discrepancies)
    if (discrepancies !== null && discrepancies.length > MAX_NOTES_LEN) {
      return NextResponse.json({ error: `Diskrepanzen dürfen maximal ${MAX_NOTES_LEN} Zeichen haben.` }, { status: 400 })
    }
    data.discrepancies = discrepancies
  }

  if (body.rating !== undefined) {
    if (body.rating === null) {
      data.rating = null
    } else {
      const rating = Number(body.rating)
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Bewertung muss zwischen 1 und 5 liegen.' }, { status: 400 })
      }
      data.rating = rating
    }
  }

  if (body.calledAt !== undefined) {
    if (body.calledAt === null || body.calledAt === '') {
      data.calledAt = null
    } else {
      const d = new Date(body.calledAt)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Ungültiges Datum.' }, { status: 400 })
      }
      data.calledAt = d
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Keine Änderungen.' }, { status: 400 })
  }

  const updated = await prisma.referenceCheck.update({ where: { id: params.id }, data })

  // Side-effect: Statuswechsel → IN_REVIEW benachrichtigt das candiq-Reviewer-Team
  // und triggert optional Round-Robin-Auto-Assignment. Beides best-effort:
  // Mail- oder Assignment-Fehler duerfen den PATCH nicht crashen.
  if (data.status === 'IN_REVIEW' && check.status !== 'IN_REVIEW') {
    if (process.env.ASSIGNMENT_AUTO === 'round_robin' && !updated.assignedReviewerId) {
      autoAssignRoundRobin(updated.id).catch((err) =>
        logger.warn('reviewer_autoassign_failed', err),
      )
    }
    notifyReviewerTeam({
      checkId: updated.id,
      customer: check.candidate.user,
      candidate: {
        name: `${check.candidate.firstName} ${check.candidate.lastName}`.trim(),
        position: check.candidate.position,
      },
      employer: {
        name: updated.employerName,
        contact: updated.employerContact ?? '—',
        phone: updated.employerPhone,
        email: updated.employerEmail,
      },
    }).catch((err) => logger.warn('reviewer_notify_failed', err))
  }

  return NextResponse.json(updated)
}

// Round-Robin: weist den Check dem Reviewer mit der geringsten Anzahl
// aktuell offener Zuweisungen zu. Bei Gleichstand alphabetische Reihenfolge.
async function autoAssignRoundRobin(checkId: string) {
  const reviewers = await prisma.user.findMany({
    where: { role: { in: ['REVIEWER', 'ADMIN'] } },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          assignedChecks: { where: { status: 'IN_REVIEW' } },
        },
      },
    },
  })
  if (reviewers.length === 0) return
  reviewers.sort((a, b) => {
    const cmp = a._count.assignedChecks - b._count.assignedChecks
    if (cmp !== 0) return cmp
    return (a.name ?? '').localeCompare(b.name ?? '')
  })
  const target = reviewers[0]
  await prisma.referenceCheck.update({
    where: { id: checkId },
    data: { assignedReviewerId: target.id, assignedAt: new Date() },
  })
  await prisma.auditLog.create({
    data: {
      userId: target.id,
      action: 'REVIEW_AUTO_ASSIGNED',
      entity: 'ReferenceCheck',
      entityId: checkId,
      details: JSON.stringify({ method: 'round_robin', queueDepth: target._count.assignedChecks }),
    },
  })
}

async function notifyReviewerTeam(opts: {
  checkId: string
  customer: { id: string; name: string | null; email: string; company: string | null }
  candidate: { name: string; position: string }
  employer: { name: string; contact: string; phone: string | null; email: string | null }
}) {
  const recipients = (process.env.REVIEWER_NOTIFICATION_EMAIL ?? 'hello@candiq.de')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (recipients.length === 0) return

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://candiq.de'
  const tpl = reviewerHandoffNotificationEmail({
    customerName: opts.customer.name ?? opts.customer.email,
    customerCompany: opts.customer.company,
    customerEmail: opts.customer.email,
    candidateName: opts.candidate.name,
    candidatePosition: opts.candidate.position,
    employerName: opts.employer.name,
    employerContact: opts.employer.contact,
    employerPhone: opts.employer.phone,
    employerEmail: opts.employer.email,
    reviewerCheckUrl: `${baseUrl}/reviewer/check/${opts.checkId}`,
    queueUrl: `${baseUrl}/reviewer/queue`,
  })
  await sendEmail({
    to: recipients,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    category: 'reviewer_handoff',
    userId: opts.customer.id,
  })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const check = await prisma.referenceCheck.findFirst({
    where: { id: params.id, candidate: { userId: session.user.id } },
  })
  if (!check) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  await prisma.referenceCheck.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
