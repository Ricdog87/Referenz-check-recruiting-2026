import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getAddon } from '@/lib/addons'
import { stripe, STRIPE_ADDON_PRICES } from '@/lib/stripe'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/addons
 *
 * Buchung eines Add-ons via Stripe-Checkout-Session (mode='payment').
 * Akzeptiert sowohl JSON ({sku}) als auch form-encoded (sku) — zweiteres
 * sodass das Dashboard ein klassisches <form method="POST" action="/api/addons">
 * nutzen kann und der Browser den 303-Redirect zur Stripe-Session selbst folgt.
 *
 * Erfolg:
 *   - JSON-Client → 200 { checkoutUrl }
 *   - Form-Client → 303 Location: <stripe session url>
 * Fehler:
 *   - 4xx/5xx mit JSON
 *
 * AddonOrder wird ERST im /api/stripe/webhook bei checkout.session.completed
 * angelegt — niemals hier, damit nichts unbezahlt in der DB landet.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  // Rate-Limit: max 20 Buchungsversuche pro User pro Stunde
  const rl = rateLimit(`addon:${session.user.id}`, 20, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Zu viele Buchungen. Bitte später erneut versuchen.' },
      { status: 429 },
    )
  }

  // SKU + optional checkId aus JSON oder form-data lesen.
  // checkId ist nur für pro-Check-Add-ons relevant (z.B. EXPRESS_24H).
  const contentType = req.headers.get('content-type') ?? ''
  let sku = ''
  let checkId = ''
  let wantsRedirect = false
  if (contentType.includes('application/json')) {
    try {
      const body = (await req.json()) as { sku?: string; checkId?: string }
      sku = body.sku ?? ''
      checkId = body.checkId ?? ''
    } catch {
      return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
    }
  } else {
    const form = await req.formData()
    sku = String(form.get('sku') ?? '')
    checkId = String(form.get('checkId') ?? '')
    wantsRedirect = true
  }

  if (!sku) {
    return NextResponse.json({ error: 'SKU fehlt' }, { status: 400 })
  }

  const addon = getAddon(sku)
  if (!addon) {
    return NextResponse.json({ error: 'Unbekannte SKU' }, { status: 400 })
  }

  // Wenn checkId gesetzt: Eigentum verifizieren — Verhindert, dass jemand
  // einen fremden Check Express-markiert über manipulierte Requests.
  let verifiedCheckId: string | null = null
  if (checkId) {
    const owned = await prisma.referenceCheck.findFirst({
      where: { id: checkId, candidate: { userId: session.user.id } },
      select: { id: true, isExpress: true },
    })
    if (!owned) {
      return NextResponse.json({ error: 'Check nicht gefunden.' }, { status: 404 })
    }
    if (owned.isExpress && addon.sku === 'EXPRESS_24H') {
      return NextResponse.json(
        { error: 'Express-24h ist für diese Prüfung bereits aktiv.' },
        { status: 409 },
      )
    }
    verifiedCheckId = owned.id
  }

  const priceId = STRIPE_ADDON_PRICES[addon.sku]
  if (!priceId) {
    console.error('addon_checkout_no_price_configured', { sku: addon.sku })
    return NextResponse.json(
      {
        error:
          'Dieses Add-on ist im Stripe-Katalog noch nicht konfiguriert. Bitte kontaktieren Sie hello@candiq.de.',
      },
      { status: 500 },
    )
  }

  // Origin sicher aus Request-Headern lesen
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host = req.headers.get('host') ?? 'candiq.de'
  const origin = `${proto}://${host}`

  // User-Email für Stripe-Checkout (pre-fill)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, stripeCustomerId: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
  }

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1, // SKU-internes "Pack" wird in addon.quantity gespeichert (10er-Pack etc.)
        },
      ],
      // Customer wiederverwenden falls vorhanden — sonst aus Email anlegen
      ...(user.stripeCustomerId
        ? { customer: user.stripeCustomerId }
        : { customer_email: user.email ?? undefined }),
      // Damit Stripe Tax automatisch greift (sofern in Stripe Settings aktiviert)
      automatic_tax: { enabled: true },
      // Adresse für DE/EU USt-Reverse-Charge / Rechnungs-Compliance
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      // Metadata wird vom Webhook gelesen → daraus wird die AddonOrder gebaut.
      // checkId nur bei pro-Check-Add-ons (Express-24h) gesetzt.
      metadata: {
        type: 'addon',
        sku: addon.sku,
        userId: session.user.id,
        quantity: String(addon.quantity),
        unitPriceCents: String(addon.price * 100),
        ...(verifiedCheckId ? { checkId: verifiedCheckId } : {}),
      },
      // Bei Express: Erfolgs-Redirect zurueck auf den Check (ohne checkId
      // bleibt der bestehende /dashboard/addons-Flow erhalten).
      success_url: verifiedCheckId
        ? `${origin}/checks/${verifiedCheckId}?express=ok&session_id={CHECKOUT_SESSION_ID}`
        : `${origin}/dashboard/addons?ok=1&sku=${encodeURIComponent(addon.sku)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: verifiedCheckId
        ? `${origin}/checks/${verifiedCheckId}?express=cancel`
        : `${origin}/dashboard/addons?cancel=1`,
      locale: 'de',
      // Audit-Trail für AGB-Akzeptanz bei Pflicht-Käufen
      consent_collection: { terms_of_service: 'required' },
      custom_text: {
        terms_of_service_acceptance: {
          message:
            'Mit der Buchung akzeptiere ich die [AGB von candiq](https://candiq.de/agb) und die [Datenschutzerklärung](https://candiq.de/datenschutz).',
        },
      },
    })

    // Audit-Log: User hat Checkout INITIATED. Order kommt erst beim Webhook.
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADDON_CHECKOUT_INITIATED',
        entity: 'Stripe.CheckoutSession',
        entityId: checkout.id,
        details: JSON.stringify({
          sku: addon.sku,
          price: addon.price,
          quantity: addon.quantity,
        }),
      },
    })

    if (!checkout.url) {
      return NextResponse.json(
        { error: 'Stripe lieferte keine Checkout-URL.' },
        { status: 502 },
      )
    }

    if (wantsRedirect) {
      // 303 See Other → Browser folgt mit GET zur Stripe-Session
      return NextResponse.redirect(checkout.url, { status: 303 })
    }
    return NextResponse.json({ checkoutUrl: checkout.url, sessionId: checkout.id })
  } catch (err: any) {
    console.error('addon_checkout_create_error', {
      sku: addon.sku,
      message: err?.message,
    })
    return NextResponse.json(
      {
        error:
          'Checkout konnte nicht gestartet werden. Bitte später erneut versuchen oder hello@candiq.de kontaktieren.',
      },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const orders = await prisma.addonOrder.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ orders })
}
