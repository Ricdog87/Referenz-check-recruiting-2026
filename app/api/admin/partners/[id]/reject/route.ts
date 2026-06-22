import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/reviewer'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { applyAdminAction } from '@/lib/partner/admin-actions'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isPartnerProgramEnabled()) return new NextResponse('Not Found', { status: 404 })

  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    /* optional body */
  }
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : undefined

  const baseUrl = process.env.NEXTAUTH_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`
  const result = await applyAdminAction({
    partnerAccountId: params.id,
    action: 'REJECT',
    adminUserId: session.user.id,
    reason,
    baseUrl,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus })
  }
  return NextResponse.json({ ok: true, status: result.status })
}
