import { headers } from 'next/headers'

/**
 * Rendert ein JSON-LD-Script mit dem CSP-Nonce aus der Middleware.
 * Server-Component — niemals als Client-Component verwenden (Nonce-Leak).
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  const nonce = headers().get('x-nonce') ?? undefined
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
