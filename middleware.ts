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

function buildCsp(nonce: string): string {
  // Production: strikte Nonce-CSP. In Development braucht Next.js Hot-Reload
  // eval(), darum dort 'unsafe-eval' zulassen.
  const isDev = process.env.NODE_ENV !== 'production'

  const scriptSrc = [
    `'self'`,
    `'nonce-${nonce}'`,
    `'strict-dynamic'`,
    isDev ? `'unsafe-eval'` : null,
  ]
    .filter(Boolean)
    .join(' ')

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'nonce-${nonce}'`,
    // CSP3: erlaubt inline `style="..."`-Attribute (framer-motion, dynamische
    // Gradienten). `<style>`-Blöcke sind weiterhin nonce-pflichtig.
    `style-src-attr 'unsafe-inline'`,
    `img-src 'self' blob: data: https://*.public.blob.vercel-storage.com`,
    `font-src 'self'`,
    `connect-src 'self'`,
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
