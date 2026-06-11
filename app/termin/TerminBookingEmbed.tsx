'use client'

import Script from 'next/script'
import { motion } from 'framer-motion'

/**
 * Client-Component: HubSpot Booking Widget mit explizitem CSP-Nonce
 * vom Server-Wrapper. Ohne diesen Nonce wuerde 'strict-dynamic' in der
 * CSP die URL-Allowlist fuer hsappstatic.net ignorieren — Script-Tag
 * waere dann von der Policy blockiert.
 */
export function TerminBookingEmbed({ nonce }: { nonce: string | undefined }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden"
    >
      <div
        className="meetings-iframe-container"
        data-src="https://meetings-eu1.hubspot.com/r-serrano/candiq-demo?embed=true"
        style={{ minHeight: '720px' }}
      />
      <Script
        src="https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js"
        strategy="afterInteractive"
        nonce={nonce}
      />
    </motion.div>
  )
}
