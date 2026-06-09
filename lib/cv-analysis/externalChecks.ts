import { resolveMx } from 'dns/promises'
import type { CandidateInput, ClaimFlag, FlagSeverity, Referee } from './types'

export type LookupStatus = 'verified' | 'mismatch' | 'unknown'

export type CompanyLookupResult = {
  status: LookupStatus
  domain?: string
  reason: string
}

export interface ExternalCheckAdapter {
  lookupCompany(company: string): Promise<CompanyLookupResult>
}

const FREEMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'yahoo.com',
  'gmx.de',
  'web.de',
  'proton.me',
  'protonmail.com',
])

const DISPOSABLE_HINTS = ['mailinator', '10minutemail', 'guerrillamail', 'tempmail', 'throwaway']
const GENERIC_ROLE = /\b(manager|lead|director|head|hr|people|talent|recruit|founder|ceo|cto|cfo|coo)\b/i

function domainFromEmail(email?: string): string | null {
  if (!email) return null
  const parts = email.toLowerCase().split('@')
  return parts.length === 2 ? parts[1] : null
}

function normalizeCompanyDomain(company: string): string {
  return company
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\b(gmbh|ag|inc|llc|ltd|limited|se|ug|kg|corp|corporation)\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<T>((resolve) => {
    timeout = setTimeout(() => resolve(fallback), timeoutMs)
  })
  const result = await Promise.race([promise, timeoutPromise])
  if (timeout) clearTimeout(timeout)
  return result
}

export class DnsCompanyLookupAdapter implements ExternalCheckAdapter {
  constructor(private timeoutMs = 1500) {}

  async lookupCompany(company: string): Promise<CompanyLookupResult> {
    if (process.env.CV_ANALYSIS_ENABLE_EXTERNAL_LOOKUPS !== 'true') {
      return { status: 'unknown', reason: 'Externe Lookups sind deaktiviert; Firmenexistenz muss manuell verifiziert werden.' }
    }

    const domain = `${normalizeCompanyDomain(company)}.com`
    return withTimeout(
      resolveMx(domain)
        .then((records) => ({
          status: records.length > 0 ? 'verified' : 'unknown',
          domain,
          reason: records.length > 0 ? `MX-Einträge für ${domain} gefunden.` : `Keine MX-Einträge für ${domain} gefunden.`,
        }) satisfies CompanyLookupResult)
        .catch(() => ({ status: 'unknown', domain, reason: `DNS-Lookup für ${domain} ohne Treffer oder nicht erreichbar.` })),
      this.timeoutMs,
      { status: 'unknown', domain, reason: `DNS-Lookup für ${domain} nach ${this.timeoutMs}ms abgebrochen.` },
    )
  }
}

function severityForExternal(status: LookupStatus): FlagSeverity {
  if (status === 'mismatch') return 'high'
  if (status === 'unknown') return 'low'
  return 'low'
}

function refereeFlags(referee: Referee): ClaimFlag[] {
  const flags: ClaimFlag[] = []
  const emailDomain = domainFromEmail(referee.email)
  const companyToken = normalizeCompanyDomain(referee.company)

  if (!emailDomain) {
    flags.push({
      claim: `${referee.name} als Referenz bei ${referee.company}`,
      type: 'referee_contact_missing_email',
      severity: 'medium',
      reason: 'Für die Referenz ist keine verifizierbare E-Mail-Adresse angegeben; Identität über unabhängigen Firmenkanal prüfen.',
      source: 'external',
    })
  } else {
    if (FREEMAIL_DOMAINS.has(emailDomain) || DISPOSABLE_HINTS.some((hint) => emailDomain.includes(hint))) {
      flags.push({
        claim: `${referee.name} nutzt ${emailDomain}`,
        type: 'referee_email_risk',
        severity: 'high',
        reason: `Die Referenz nutzt eine Frei-/Wegwerf-Maildomain (${emailDomain}) statt einer nachvollziehbaren Firmenadresse.`,
        source: 'external',
      })
    } else if (companyToken && !emailDomain.replace(/[^a-z0-9]/g, '').includes(companyToken.slice(0, Math.min(6, companyToken.length)))) {
      flags.push({
        claim: `${referee.name} E-Mail-Domain ${emailDomain} für ${referee.company}`,
        type: 'referee_domain_mismatch',
        severity: 'medium',
        reason: `Die E-Mail-Domain (${emailDomain}) passt nicht offensichtlich zum Firmennamen ${referee.company}; über offizielle Firmenkontakte gegenprüfen.`,
        source: 'external',
      })
    }
  }

  if (!GENERIC_ROLE.test(referee.role)) {
    flags.push({
      claim: `${referee.name} Rolle: ${referee.role}`,
      type: 'referee_role_plausibility',
      severity: 'low',
      reason: 'Die angegebene Rolle lässt die Referenzbefugnis nicht klar erkennen; Beziehung und Berichtslinie im Call klären.',
      source: 'external',
    })
  }

  return flags
}

export async function runExternalChecks(
  input: CandidateInput,
  adapter: ExternalCheckAdapter = new DnsCompanyLookupAdapter(),
): Promise<ClaimFlag[]> {
  const flags: ClaimFlag[] = []
  const companies = Array.from(new Set([...input.stations.map((station) => station.company), ...input.referees.map((referee) => referee.company)]))
  const lookups = new Map<string, CompanyLookupResult>()

  await Promise.all(
    companies.map(async (company) => {
      const lookup = await adapter.lookupCompany(company)
      lookups.set(company.toLowerCase(), lookup)
      if (lookup.status !== 'verified') {
        flags.push({
          claim: `Firmenexistenz ${company}`,
          type: 'employer_lookup',
          severity: severityForExternal(lookup.status),
          reason: lookup.reason,
          source: 'external',
        })
      }
    }),
  )

  for (const referee of input.referees) {
    flags.push(...refereeFlags(referee))
  }

  return flags
}
