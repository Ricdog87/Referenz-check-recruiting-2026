import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

/**
 * i18n-Routing fuer candiq.
 *
 * - `de` ist Default-Locale; ohne Prefix sichtbar (z.B. `/`).
 * - `en` wird unter `/en/...` ausgeliefert (Subpath).
 * - PR 1 deckt die Landing-Page ab. Weitere Routen folgen in PR 2.
 *
 * `localePrefix: 'as-needed'` -> Default-Locale ohne Prefix, andere mit.
 */
export const routing = defineRouting({
  locales: ['de', 'en'] as const,
  defaultLocale: 'de',
  localePrefix: 'as-needed',
})

export type Locale = (typeof routing.locales)[number]

// Light wrappers von next-intl/navigation: behalten Link, redirect, usePathname
// usw. locale-aware. Verwendung wie bei next/link, nur aus diesem Modul.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
