import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail, checkCompletedEmail } from '@/lib/email'
import { dashboardCacheTag } from '@/lib/dashboard-stats'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const check = await prisma.referenceCheck.findFirst({
    where: { id: params.id, candidate: { userId: session.user.id } },
    include: { candidate: { select: { firstName: true, lastName: true } } },
  })
  if (!check) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const allowed = ['status', 'result', 'callNotes', 'discrepancies', 'rating', 'calledAt']
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key]
  }

  const updated = await prisma.referenceCheck.update({ where: { id: params.id }, data })

  revalidateTag(dashboardCacheTag(session.user.id))

  // Mail-Trigger: Wechsel auf COMPLETED + Result-Wert vorhanden + nicht schon vorher COMPLETED.
  // Fire-and-forget; Mail-Versand darf den Request nicht blockieren oder zum Crash bringen.
  const becameCompleted = check.status !== 'COMPLETED' && updated.status === 'COMPLETED' && updated.result
  if (becameCompleted) {
    notifyCompleted({
      userId: session.user.id,
      candidateName: `${check.candidate.firstName} ${check.candidate.lastName}`,
      employerName: check.employerName,
      result: updated.result!,
      checkId: check.id,
      reqUrl: req.url,
    }).catch((err) => console.error('check_completed_mail_warn', err))
  }

  return NextResponse.json(updated)
}

async function notifyCompleted(opts: {
  userId: string
  candidateName: string
  employerName: string
  result: string
  checkId: string
  reqUrl: string
}) {
  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { email: true, name: true },
  })
  if (!user) return

  const baseUrl = process.env.NEXTAUTH_URL ?? new URL(opts.reqUrl).origin
  const tpl = checkCompletedEmail({
    name: user.name,
    candidateName: opts.candidateName,
    employerName: opts.employerName,
    result: opts.result,
    checkUrl: `${baseUrl}/checks/${opts.checkId}`,
  })
  await sendEmail({
    to: user.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    userId: opts.userId,
    category: 'check-completed',
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
  revalidateTag(dashboardCacheTag(session.user.id))
  return NextResponse.json({ ok: true })
}
