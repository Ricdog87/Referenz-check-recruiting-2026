'use client'

import { useTranslations } from 'next-intl'
import { Marquee } from '../landing/Marquee'
import { Reveal } from '../landing/Reveal'

export function TrustBarI18n() {
  const t = useTranslations('landing.trustBar')
  return (
    <section className="py-10 border-y border-border bg-bg-secondary/50">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center text-xs font-semibold text-text-muted uppercase tracking-widest mb-5">
            {t('label')}
          </div>
          <Marquee />
        </Reveal>
      </div>
    </section>
  )
}
