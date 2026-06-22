/**
 * __tests__/partner-landing-gating.test.ts
 *
 * KRITISCH: stellt sicher, dass auf der ÖFFENTLICHEN /partner-Landing
 * keine EK-Preise, Discount-Prozente oder Plan-Preis-Imports leaken.
 *
 * Ansatz: Datei-Inhalts-Scan. Wir lesen die Source-Files (Page + Section)
 * und matchen gegen verbotene Muster. Das ist ein statisch-konservativer
 * Test — wenn wir hier durchkommen, weiß der CI, dass die Marketing-Page
 * sauber ist. Falls jemand später einen Import von HR_PLANS einbaut,
 * schlägt der Build sofort fehl.
 *
 * SEPARAT: Co-Brand-Komponente prüfen wir auf das Pflicht-Siegel.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const repoRoot = resolve(__dirname, '..')

function readSrc(rel: string): string {
  return readFileSync(resolve(repoRoot, rel), 'utf-8')
}

// ─────────────────────────────────────────────────────────────────
// 1. Public-Landing — KEINE EK-Werte, KEINE Discount-%
// ─────────────────────────────────────────────────────────────────

describe('public /partner landing — no EK leak', () => {
  const FILES = [
    'app/partner/page.tsx',
    'components/landing/sections/PartnerLanding.tsx',
  ]

  // Verbotene Plan-Preise aus lib/utils.ts (HR_PLANS + AGENCY_PLANS):
  //   79 / 65 / 249 / 199 / 599 / 499 / 199 / 159 / 549 / 449 / 1299 / 1099
  // Wir matchen sie mit Währungs-/Cent-Kontext (vermeidet false positives
  // auf "5 aktive Kunden" etc.).
  const FORBIDDEN_PRICE_PATTERNS = [
    /\b79\s*€/, /\b65\s*€/,
    /\b249\s*€/, /\b199\s*€/,
    /\b599\s*€/, /\b499\s*€/,
    /\b159\s*€/, /\b549\s*€/, /\b449\s*€/,
    /\b1299\s*€/, /\b1099\s*€/,
  ]

  // Discount-Prozente aus PartnerTier-Seed:
  const FORBIDDEN_DISCOUNT_PATTERNS = [
    /\b15\s*%/, /\b22\s*%/, /\b30\s*%/, /\b38\s*%/,
  ]

  const FORBIDDEN_IDENTIFIERS = [
    'HR_PLANS',
    'AGENCY_PLANS',
    'ekDiscountPct',
    'ekPriceCents',
    'listPriceMonthlyCents',
    'listPriceAnnualCents',
    'baseEkMonthlyCents',
    'baseEkAnnualCents',
    'resolveEk',
    'resolveAllEkForPartner',
  ]

  // Verbotene Imports:
  const FORBIDDEN_IMPORTS = [
    /from\s+['"]@\/lib\/partner\/pricing['"]/,
    /from\s+['"]@\/lib\/utils['"]\s*[\s\S]*HR_PLANS/,
    /from\s+['"]@\/lib\/utils['"]\s*[\s\S]*AGENCY_PLANS/,
  ]

  for (const file of FILES) {
    describe(file, () => {
      const src = readSrc(file)

      // Comment-Lines & multi-line-block-comments rausstrippen — Reminder-Kommentare
      // ("darf nichts aus HR_PLANS importieren") dürfen den Test nicht triggern.
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
        .replace(/^\s*\*.*$/gm, '')

      it('contains no plan EUR prices', () => {
        for (const re of FORBIDDEN_PRICE_PATTERNS) {
          expect(stripped, `forbidden price match for ${re}`).not.toMatch(re)
        }
      })

      it('contains no tier discount percentages', () => {
        for (const re of FORBIDDEN_DISCOUNT_PATTERNS) {
          expect(stripped, `forbidden discount match for ${re}`).not.toMatch(re)
        }
      })

      it('contains no EK-related identifiers', () => {
        for (const id of FORBIDDEN_IDENTIFIERS) {
          expect(stripped, `forbidden identifier: ${id}`).not.toContain(id)
        }
      })

      it('does not import the pricing resolver or HR_PLANS/AGENCY_PLANS', () => {
        for (const re of FORBIDDEN_IMPORTS) {
          expect(stripped, `forbidden import: ${re}`).not.toMatch(re)
        }
      })
    })
  }
})

// ─────────────────────────────────────────────────────────────────
// 2. Public-Auth-Routes (/partner/login, /partner/register etc.) — keine EK
// ─────────────────────────────────────────────────────────────────

describe('public partner auth pages — no EK leak', () => {
  const FILES = [
    'app/partner/login/page.tsx',
    'app/partner/register/page.tsx',
    'app/partner/forgot-password/page.tsx',
    'app/partner/reset-password/page.tsx',
    'app/partner/pending/page.tsx',
    'components/partner/RegisterForm.tsx',
    'components/partner/LoginForm.tsx',
    'components/partner/ForgotForm.tsx',
    'components/partner/ResetForm.tsx',
  ]

  it('none of the public auth pages import the pricing resolver', () => {
    for (const file of FILES) {
      const src = readSrc(file)
      expect(src, `${file}: must not import lib/partner/pricing`).not.toMatch(
        /from\s+['"]@\/lib\/partner\/pricing['"]/,
      )
      expect(src, `${file}: must not import HR_PLANS/AGENCY_PLANS`).not.toMatch(
        /(HR_PLANS|AGENCY_PLANS)/,
      )
    }
  })
})

// ─────────────────────────────────────────────────────────────────
// 3. Co-Brand-Komponente — candiq-Siegel MUSS gemounted sein, unentfernbar
// ─────────────────────────────────────────────────────────────────

describe('co-brand uploader — candiq seal is mandatory', () => {
  const src = readSrc('components/partner/PartnerCoBrandUploader.tsx')

  it('renders the seal text in the report-preview', () => {
    expect(src).toMatch(/verifiziert durch/i)
    expect(src).toMatch(/candiq/)
  })

  it('does not contain any conditional logic that could HIDE the seal', () => {
    // Keine "hideSeal", "noBranding", "whitelabel"-Schalter
    expect(src).not.toMatch(/hideSeal|noBranding|whiteLabel|removeSeal/i)
  })

  it('seal renders inside JSX (not as a comment or string constant only)', () => {
    // Stelle sicher, dass der Text in einer <span>/<strong>-Struktur lebt
    expect(src).toMatch(/<(span|strong|div)[^>]*>[\s\S]*verifiziert durch[\s\S]*<\/(span|strong|div)>/)
  })
})

// ─────────────────────────────────────────────────────────────────
// 4. Domain-Isolation — Partner-Code importiert nicht aus User-Auth-Welt
// ─────────────────────────────────────────────────────────────────

describe('domain isolation — no cross-imports between partner and user auth', () => {
  it('lib/partner/auth.ts does not import from lib/auth.ts', () => {
    const src = readSrc('lib/partner/auth.ts')
    expect(src).not.toMatch(/from\s+['"]@\/lib\/auth['"]/)
  })

  it('lib/partner/session.ts does not import from lib/auth.ts', () => {
    const src = readSrc('lib/partner/session.ts')
    expect(src).not.toMatch(/from\s+['"]@\/lib\/auth['"]/)
  })

  it('lib/auth.ts does not import from lib/partner/*', () => {
    const src = readSrc('lib/auth.ts')
    expect(src).not.toMatch(/from\s+['"]@\/lib\/partner/)
  })

  it('partner NextAuth handler uses partnerAuthOptions (not authOptions)', () => {
    const src = readSrc('app/api/auth/partner/[...nextauth]/route.ts')
    expect(src).toMatch(/partnerAuthOptions/)
    expect(src).not.toMatch(/import\s*\{\s*authOptions\s*\}/)
  })
})
