import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { BOOKING_URL } from '@/lib/site'

export function LandingFooterI18n() {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')

  return (
    <footer className="border-t border-border bg-bg-secondary px-6 py-14">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-10 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center mb-5" aria-label={tNav('ariaHomeLink')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="candiq" width={120} height={32} className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm mb-5">
              {t('tagline')}
            </p>
            <div className="text-sm text-text-secondary mb-3">
              <span className="text-text-muted">{t('supportLabel')}</span>{' '}
              <a href="mailto:hello@candiq.de" className="font-semibold text-brand-700 hover:text-brand-800 transition-colors">
                hello@candiq.de
              </a>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>{t('madeIn')}</span>
            </div>
          </div>

          <FooterCol
            title={t('col.product')}
            links={[
              { label: t('links.pricing'), href: '/preise' },
              { label: t('links.resources'), href: '/resources' },
              { label: t('links.liveDemo'), href: '/demo' },
              { label: t('links.bookCall'), href: BOOKING_URL, external: true },
            ]}
          />

          <FooterCol
            title={t('col.forWhom')}
            links={[
              { label: t('links.hrTeams'), href: '/preise#hr' },
              { label: t('links.agenciesSoon'), href: '/waitlist-agency' },
              { label: t('links.enterprise'), href: '/preise#enterprise' },
              { label: t('links.techRecruiting'), href: '/branchen/tech-recruiting' },
              { label: t('links.salesRecruiting'), href: '/branchen/sales-recruiting' },
              { label: t('links.healthcareRecruiting'), href: '/branchen/healthcare-recruiting' },
            ]}
          />

          <FooterCol
            title={t('col.legal')}
            links={[
              { label: t('links.privacy'), href: '/datenschutz' },
              { label: t('links.terms'), href: '/agb' },
              { label: t('links.imprint'), href: '/impressum' },
              { label: t('links.dpa'), href: '/datenschutz#avv' },
            ]}
          />
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <div>{t('copyright')}</div>
          <div className="hidden md:block text-[11px] text-text-muted">
            {t('pdlNotice')}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-text-primary transition-colors">{t('signIn')}</Link>
            <Link href="/register" className="hover:text-text-primary transition-colors">{t('createAccount')}</Link>
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
              <Link href={l.href as any} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
