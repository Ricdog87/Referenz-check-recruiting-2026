import { headers } from 'next/headers'
import { CalendarCheck, ShieldCheck, Clock3, Sparkles } from 'lucide-react'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { TerminBookingEmbed } from './TerminBookingEmbed'

/**
 * /termin — candiq-branded HubSpot Meeting Booking Page.
 *
 * Wraps the HubSpot meetings embed (r-serrano/candiq-demo) in the candiq
 * corporate-design shell so customers stay in the candiq brand context
 * during the entire booking flow.
 *
 * Server-Component, damit der CSP-Nonce aus der Middleware abgegriffen
 * und explizit an den HubSpot-<Script> durchgereicht werden kann. Ohne
 * Nonce blockt 'strict-dynamic' den externen Script-Tag selbst dann,
 * wenn der Host in der URL-Allowlist steht (CSP3-Verhalten).
 */
export default function TerminPage() {
  const nonce = headers().get('x-nonce') ?? undefined

  return (
    <>
      <LandingNav />

      <main id="main" className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-brand-50/40 to-white">
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-50" aria-hidden>
            <div className="absolute top-20 -left-20 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl" />
          </div>

          <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-sm font-medium text-brand-600">
              <CalendarCheck className="h-4 w-4" />
              Live-Showcase &middot; 15-Minuten-Termin
            </div>

            <h1 className="mt-6 text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary">
              Schauen Sie sich{' '}
              <span className="text-brand-600">candiq</span>
              <br className="hidden sm:block" />
              {' '}in 15 Minuten an.
            </h1>

            <p className="mt-6 max-w-2xl text-base md:text-lg text-text-secondary">
              Reference Checks brauchen aktive Begleitung &mdash; kein Self-Service-Trial.
              Buchen Sie einen 15-Minuten-Termin: wir schauen gemeinsam ins echte
              Dashboard und richten Ihren pers&ouml;nlichen Testzugang ein.
            </p>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Clock3 className="h-4 w-4 text-brand-600" />
                15 Minuten
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                DSGVO-konform &middot; EU-Server
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Sparkles className="h-4 w-4 text-brand-600" />
                Pers&ouml;nliche Beratung
              </div>
            </div>
          </div>
        </section>

        {/* HubSpot Booking Widget (Client-Component, bekommt Nonce per Prop) */}
        <section className="bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-5xl mx-auto px-6 pb-24">
            <TerminBookingEmbed nonce={nonce} />

            <p className="mt-6 text-center text-xs text-text-secondary">
              Termin passt nicht? Schreiben Sie kurz an{' '}
              <a href="mailto:hello@candiq.de" className="text-brand-600 hover:underline">
                hello@candiq.de
              </a>
              {' '}&mdash; wir finden eine andere Zeit.
            </p>
          </div>
        </section>
      </main>

      <LandingFooter />
    </>
  )
}
