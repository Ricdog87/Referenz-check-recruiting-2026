import Link from 'next/link'
import { BOOKING_URL } from '@/lib/site'

export function LandingFooterEn() {
  return (
    <footer className="border-t border-border bg-bg-secondary px-6 py-14">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-10 mb-12">
          <div className="md:col-span-2">
            <Link href="/en" className="flex items-center mb-5" aria-label="candiq home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="candiq" width={120} height={32} className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm mb-5">
              GDPR-compliant reference checks for modern HR teams and recruitment agencies across the DACH region.
            </p>
            <div className="text-sm text-text-secondary mb-3">
              <span className="text-text-muted">Support &amp; contact:</span>{' '}
              <a href="mailto:hello@candiq.de" className="font-semibold text-brand-700 hover:text-brand-800 transition-colors">
                hello@candiq.de
              </a>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>🇩🇪 Made in Germany</span>
            </div>
          </div>

          <FooterCol
            title="Product"
            links={[
              { label: 'Pricing', href: '/preise' },
              { label: 'Live demo', href: '/demo' },
              { label: 'Book a call', href: BOOKING_URL, external: true },
            ]}
          />

          <FooterCol
            title="Who it's for"
            links={[
              { label: 'HR departments', href: '/preise#hr' },
              { label: 'Recruitment agencies', href: '/register?type=RECRUITMENT_AGENCY' },
              { label: 'Enterprise', href: 'mailto:hello@candiq.de?subject=Enterprise%20inquiry', external: true },
            ]}
          />

          <FooterCol
            title="Legal"
            links={[
              { label: 'Privacy policy', href: '/datenschutz' },
              { label: 'Terms of Service', href: '/agb' },
              { label: 'Imprint', href: '/impressum' },
            ]}
          />
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <div>© 2026 RSG Recruiting Solutions group GmbH · All rights reserved.</div>
          <div className="hidden md:block text-[11px] text-text-muted">
            Most pages are currently in German. We&rsquo;re rolling out English progressively.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-text-primary transition-colors">Deutsch</Link>
            <Link href="/login" className="hover:text-text-primary transition-colors">Sign in</Link>
            <a href="mailto:hello@candiq.de" className="hover:text-text-primary transition-colors">hello@candiq.de</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string; external?: boolean }[]
}) {
  return (
    <div>
      <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            {l.external ? (
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
