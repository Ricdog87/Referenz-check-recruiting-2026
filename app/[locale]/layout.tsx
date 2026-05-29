import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { routing, type Locale } from '@/i18n/routing'

/**
 * Locale-aware Wrapper-Layout. Eltern-Layout (`app/layout.tsx`) liefert
 * `<html>`/`<body>`/Skip-Link/HubSpot — diese Datei stellt nur die
 * NextIntl-Client-Provider-Boundary und Locale-spezifische Metadata.
 */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!routing.locales.includes(locale as Locale)) return {}
  const t = await getTranslations({ locale, namespace: 'metadata' })
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://candiq.de'

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: locale === routing.defaultLocale ? '/' : `/${locale}`,
      languages: {
        de: '/',
        en: '/en',
        'x-default': '/',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'en' ? 'en_GB' : 'de_DE',
      url: locale === routing.defaultLocale ? baseUrl : `${baseUrl}/${locale}`,
      siteName: 'candiq',
      title: t('title'),
      description: t('ogDescription'),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('twitterTitle'),
      description: t('twitterDescription'),
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as Locale)) {
    notFound()
  }

  // Erlaubt statische Generierung pro Locale.
  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
