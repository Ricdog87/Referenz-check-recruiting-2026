/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  // H1 (SEO): Duplicate-Content beseitigen. Die fuenf statischen Geo-Pages
  // /referenzcheck-{stadt} werden dauerhaft auf den kanonischen dynamischen
  // Pfad /referenzpruefung/{stadt} umgeleitet. Bewusst `statusCode: 301`
  // (nicht `permanent: true`, das waere 308) — klassischer Permanent-Redirect,
  // den Crawler erwarten und den der Smoke-Test explizit auf 301 prueft.
  async redirects() {
    return [
      { source: '/referenzcheck-berlin',    destination: '/referenzpruefung/berlin',    statusCode: 301 },
      { source: '/referenzcheck-muenchen',  destination: '/referenzpruefung/muenchen',  statusCode: 301 },
      { source: '/referenzcheck-hamburg',   destination: '/referenzpruefung/hamburg',   statusCode: 301 },
      { source: '/referenzcheck-koeln',     destination: '/referenzpruefung/koeln',     statusCode: 301 },
      { source: '/referenzcheck-frankfurt', destination: '/referenzpruefung/frankfurt', statusCode: 301 },
      // Demo-Self-Service wurde abgeschafft (siehe Commit: "Demo-Profile raus").
      // Demo gibt es nur noch nach persoenlichem Termin. /demo wird permanent auf
      // die Termin-Buchungs-Page geleitet — fuer SEO und externe Backlinks.
      { source: '/demo',     destination: '/termin', statusCode: 301 },
      { source: '/api/demo', destination: '/termin', statusCode: 301 },
    ]
  },
  async headers() {
    // Hinweis: Die Content-Security-Policy wird per Request in `middleware.ts`
    // mit Nonce gesetzt. Hier nur statische, request-unabhängige Header.
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
