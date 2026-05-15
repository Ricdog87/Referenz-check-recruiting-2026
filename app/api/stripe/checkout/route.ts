import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stripe, STRIPE_PRICES, type PlanKey, type Interval } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PLANS: PlanKey[] = ['starter', 'professional', 'business']
const INTERVALS: Interval[] = ['monthly', 'yearly']

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  }

  let body: { plan?: string; interval?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const plan = String(body.plan ?? '').toLowerCase() as PlanKey
  const interval = String(body.interval ?? 'monthly').toLowerCase() as Interval

  if (!PLANS.includes(plan) || !INTERVALS.includes(interval)) {
    return NextResponse.json({ error: 'Ungültiger Plan oder Intervall.' }, { status: 400 })
  }

  const price = STRIPE_PRICES[plan][interval]
  if (!price) {
    return NextResponse.json({ error: 'Price ID nicht konfiguriert.' }, { status: 500 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'Benutzer nicht gefunden.' }, { status: 404 })
  }

  try {
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/preise?checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      automatic_tax: { enabled: true },
      customer_update: { address: 'auto', name: 'auto' },
      subscription_data: {
        metadata: { userId: user.id, plan, interval },
      },
      metadata: { userId: user.id, plan, interval },
    })

    if (!checkout.url) {
      return NextResponse.json({ error: 'Checkout-URL fehlt.' }, { status: 500 })
    }

    return NextResponse.json({ url: checkout.url })
  } catch (err: any) {
    console.error('stripe_checkout_error', { message: err?.message, type: err?.type })
    return NextResponse.json(
      { error: 'Checkout konnte nicht gestartet werden. Bitte später erneut versuchen.' },
      { status: 500 },
    )
  }
}
