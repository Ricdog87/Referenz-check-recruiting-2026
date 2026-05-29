'use client'

import dynamic from 'next/dynamic'

// SSR ausgeschaltet — Chat ist ein client-only Streaming-Widget.
// Wrapper im Client-Boundary, damit { ssr: false } in Next 14 sauber durchgeht.
const AIConcierge = dynamic(() => import('./AIConcierge'), {
  ssr: false,
})

export default function AIConciergeMount() {
  return <AIConcierge />
}
