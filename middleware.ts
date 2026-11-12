import { withAuth } from 'next-auth/middleware'
import type { NextRequestWithAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextFetchEvent, NextRequest } from 'next/server'
import { isAppAccessEnabled } from '@/lib/flags'
import {
  CLOSED_APP_REDIRECT,
  PROTECTED_PREFIXES,
  closedAppAction,
} from '@/lib/appAccess'

/**
 * PROTECTED_PREFIXES (lib/appAccess.ts) sind die auth-geschützten Pfade.
 * Alle anderen Routen dürfen ohne Token besucht werden, laufen aber trotzdem
 * durch die Middleware, damit sie eine Per-Request-CSP mit Nonce bekommen.
 */

// HubSpot Meetings Embed (z. B. auf /termin) lädt Script + iframe von
// dedizierten Subdomains; alle hier explizit, kein Wildcard.
const HUBSPOT_SCRIPT = 'https://static.hsappstatic.net'
const HUBSPOT_FRAME = 'https://meetings-eu1.hubspot.com'
const HUBSPOT_CONNECT = 'https://forms.hubspot.com https://meetings-eu1.hubspot.com'
const HUBSPOT_IMG = 'https://*.hubspotusercontent-eu1.net'


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
    `img-src 'self' blob: data: https://*.public.blob.vercel-storage.com ${HUBSPOT_IMG} https://*.google-analytics.com https://www.googletagmanager.com`,
    `font-src 'self'`,
    // connect-src: Stripe REST + Vercel Analytics / Speed Insights + HubSpot API
    // (XHR vom Meetings-Embed-Script) + GA4 (gtag.js feuert /g/collect-Hits
    // an region1.google-analytics.com bzw. www.google-analytics.com; ohne
    // diese Hosts dropped der Browser jeden Hit lautlos und wir sehen 0
    // Analytics-Daten trotz korrekt konfiguriertem gtag).
    `connect-src 'self' https://api.stripe.com https://vitals.vercel-insights.com https://va.vercel-scripts.com ${HUBSPOT_CONNECT} https://api.elevenlabs.io wss://api.elevenlabs.io https://api.us.elevenlabs.io wss://api.us.elevenlabs.io https://*.livekit.cloud wss://*.livekit.cloud https://storage.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com`,
    // frame-src: Stripe Checkout/Elements + 3-D-Secure (hooks) + HubSpot Meetings.
    `frame-src https://js.stripe.com https://hooks.stripe.com ${HUBSPOT_FRAME}`,
    `media-src 'self' blob: data: https://storage.googleapis.com`,
    `worker-src 'self' blob:`,
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
  // x-pathname erlaubt dem Root-Layout, locale-bewusst `<html lang>` zu setzen,
  // ohne next-intl-Middleware aufsetzen zu müssen (Quelle des PR #62-500ers).
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-pathname', req.nextUrl.pathname)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

const authMiddleware = withAuth(
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

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl
  const isApi = pathname.startsWith('/api/')

  if (isAppAccessEnabled()) {
    // API-Routen prüfen ihre Session selbst und bekommen ihre Header aus
    // next.config.js — sie stehen nur wegen der Sperre unten im Matcher.
    if (isApi) return NextResponse.next()
    return authMiddleware(req as NextRequestWithAuth, event)
  }

  // App-Zugang geschlossen (Default): keine Registrierung, kein Login, kein
  // Dashboard. Bestehende Session-Cookies werden nirgends mehr akzeptiert.
  switch (closedAppAction(pathname)) {
    case 'redirect':
      return NextResponse.redirect(new URL(CLOSED_APP_REDIRECT, req.url), 307)
    case 'empty-session':
      return NextResponse.json({}, { headers: { 'Cache-Control': 'no-store' } })
    case 'not-found':
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      )
    default:
      return isApi ? NextResponse.next() : withNonceAndCsp(req)
  }
}

export const config = {
  matcher: [
    /*
     * Alle HTML-Routen außer:
     *  - /api/* (statische Header in next.config.js decken das ab)
     *  - _next/static, _next/image (Build-Assets)
     *  - favicon, logos, OG-/Twitter-Bilder, robots, sitemap (statisches Marketing-Material)
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|favicon\\.svg|logo.*\\.svg|opengraph-image|twitter-image|apple-icon|robots\\.txt|sitemap\\.xml).*)',
    /*
     * Konto- und Session-APIs — nur damit die Sperre bei geschlossenem
     * App-Zugang greift. Muss zu CLOSED_API_PREFIXES / CLOSED_API_EXACT in
     * lib/appAccess.ts passen (Next.js verlangt hier statische Strings).
     */
    '/api/auth/:path*',
    '/api/addons/:path*',
    '/api/admin/partners/:path*',
    '/api/candidates/:path*',
    '/api/checks/:path*',
    '/api/cv-analysis',
    '/api/documents/:path*',
    '/api/gdpr/:path*',
    '/api/reviewer/:path*',
    '/api/sample-data/:path*',
    '/api/stripe/checkout',
    '/api/stripe/portal',
    '/api/upload/:path*',
  ],
}
