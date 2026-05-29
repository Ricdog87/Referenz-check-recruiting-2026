import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

/**
 * Per-Request i18n-Konfiguration (siehe next-intl/plugin in next.config.js).
 *
 * Lädt die Messages-Datei für die angeforderte Locale. Falls die Locale
 * ungültig ist (Tippfehler in URL, Bot-Request), fallen wir sicher auf
 * die Default-Locale zurück.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
