import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth-geschützte Pfade. Alle anderen Routen dürfen ohne Token besucht werden,
 * laufen aber trotzdem durch die Middleware, damit sie eine Per-Request-CSP
 * mit Nonce bekommen.
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/candidates',
  '/checks',
  '/clients',
  '/integrations',
  '/analytics',
  '/settings',
  '/audit',
  '/addons',
  '/report',
]

// HubSpot Meetings Embed (z. B. auf /termin) lädt Script + iframe von
// dedizierten Subdomains; alle hier explizit, kein Wildcard.
const HUBSPOT_SCRIPT = 'https://static.hsappstatic.net'
const HUBSPOT_FRAME = 'https://meetings-eu1.hubspot.com'
const HUBSPOT_CONNECT = 'https://forms.hubspot.com https://meetings-eu1.hubspot.com'
const HUBSPOT_IMG = 'https://*.hubspotusercontent-eu1.net'

// HubSpot Live-Chat (Conversations) — Loader-Subdomains, eu1-Region.
// Doku: https://developers.hubspot.com/docs/api/conversations/chat-widget-sdk
const HS_CHAT_SCRIPT =
  'https://js-eu1.hs-scripts.com https://js.hs-banner.com https://js.usemessages.com https://js-eu1.usemessages.com https://js-eu1.hs-banner.com'
const HS_CHAT_CONNECT =
  'https://api-eu1.hubspot.com https://api.hubspot.com https://track-eu1.hubspot.com https://app-eu1.hubspot.com'
const HS_CHAT_FRAME = 'https://app-eu1.hubspot.com'
const HS_CHAT_IMG = 'https://forms.hsforms.com https://track-eu1.hubspot.com'

function buildCsp(nonce: string): string {
  // Production: strikte Nonce-CSP. In Development braucht Next.js Hot-Reload
  // eval(), darum dort 'unsafe-eval' zulassen.
  const isDev = process.env.NODE_ENV !== 'production'

  const scriptSrc = [
    `'self'`,
    `'nonce-${nonce}'`,
    `'strict-dynamic'`,
    // Stripe.js + Vercel Analytics — werden nur in Verbindung mit dem Nonce
    // dynamisch nachgeladen (strict-dynamic propagiert Vertrauen).
    `https://js.stripe.com`,
    `https://va.vercel-scripts.com`,
    // HubSpot Meetings Embed (für /termin)
    HUBSPOT_SCRIPT,
    HS_CHAT_SCRIPT,
    isDev ? `'unsafe-eval'` : null,
  ]
    .filter(Boolean)
    .join(' ')

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    // CSP3: erlaubt inline `style="..."`-Attribute (framer-motion, dynamische
    // Gradienten). `<style>`-Blöcke sind weiterhin nonce-pflichtig.
    `style-src-attr 'unsafe-inline'`,
    `img-src 'self' blob: data: https://*.public.blob.vercel-storage.com ${HUBSPOT_IMG} ${HS_CHAT_IMG}`,
    `font-src 'self'`,
    // connect-src: Stripe REST + Vercel Analytics / Speed Insights + HubSpot API
    // (XHR vom Meetings-Embed-Script).
    `connect-src 'self' https://api.stripe.com https://vitals.vercel-insights.com https://va.vercel-scripts.com ${HUBSPOT_CONNECT} ${HS_CHAT_CONNECT}`,
    // frame-src: Stripe Checkout/Elements + 3-D-Secure (hooks) + HubSpot Meetings.
    `frame-src https://js.stripe.com https://hooks.stripe.com ${HUBSPOT_FRAME} ${HS_CHAT_FRAME}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ')
}

function withNonceAndCsp(req: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)

  // Nonce in Request-Headern, damit Server Components ihn via `headers()`
  // lesen und an inline `<script>` / `<style>` weitergeben können.
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export default withAuth(
  function middleware(req) {
    return withNonceAndCsp(req)
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const pathname = req.nextUrl.pathname
        const requiresAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
        return requiresAuth ? !!token : true
      },
    },
  },
)

export const config = {
  matcher: [
    /*
     * Alle HTML-Routen außer:
     *  - /api/* (statische Header in next.config.js decken das ab)
     *  - _next/static, _next/image (Build-Assets)
     *  - favicon, logos, OG-/Twitter-Bilder, robots, sitemap (statisches Marketing-Material)
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|favicon\\.svg|logo.*\\.svg|opengraph-image|twitter-image|apple-icon|robots\\.txt|sitemap\\.xml).*)',
  ],
}
