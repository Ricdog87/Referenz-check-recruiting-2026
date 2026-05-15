import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: 'no customer' }, { status: 400 })
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/settings/billing`,
    })
    return NextResponse.json({ url: portal.url })
  } catch (err: any) {
    console.error('stripe_portal_error', { message: err?.message })
    return NextResponse.json({ error: 'portal session failed' }, { status: 500 })
  }
}
