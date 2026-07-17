/**
 * __tests__/zvoove-integration.test.ts
 *
 * Tests fuer das zvoove-Integrations-Modul. Pure Unit-Tests fuer Mapper +
 * Consent-Guard, plus Integration-Tests gegen den MockZvooveClient.
 *
 * KRITISCH: Der „Consent-Gate hält"-Test ist NICHT verhandelbar — ohne
 * gruen wird die Integration nie auf prod geschaltet.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  mapZvooveToCandiq,
  mapZvooveExperiencesToCheckDrafts,
  hashZvooveProfile,
} from '@/lib/integrations/zvoove/mapper'
import {
  assertConsentSafeCandidateInput,
  assertConsentSafeCheckStatus,
  ZVOOVE_IMPORT_DEFAULTS,
} from '@/lib/integrations/zvoove/consent-guard'
import {
  MockZvooveClient,
  FIXTURE_CANDIDATE_BASIC,
  FIXTURE_CANDIDATE_MINIMAL,
} from '@/lib/integrations/zvoove/__mocks__/MockZvooveClient'
import { encryptSecret, decryptSecret, fingerprintSecret } from '@/lib/crypto/aes-gcm'
import { isFlagEnabled, isZvooveEnabled } from '@/lib/flags'

// ── Mapper ───────────────────────────────────────────────────────────────

describe('mapZvooveToCandiq', () => {
  it('uebernimmt Stammdaten korrekt', () => {
    const out = mapZvooveToCandiq(FIXTURE_CANDIDATE_BASIC)
    expect(out.firstName).toBe('Anna')
    expect(out.lastName).toBe('Mustermann')
    expect(out.email).toBe('anna.mustermann@example.com')
    expect(out.position).toBe('Senior Sales Lead')
  })

  it('setzt IMMER status=PENDING (Consent-Guard)', () => {
    const out = mapZvooveToCandiq(FIXTURE_CANDIDATE_BASIC)
    expect(out.status).toBe('PENDING')
  })

  it('verwirft ungueltige E-Mail-Adressen', () => {
    const out = mapZvooveToCandiq({
      ...FIXTURE_CANDIDATE_BASIC,
      email: 'kein-valid-email',
    })
    expect(out.email).toBeNull()
  })

  it('kuerzt zu lange Felder defensiv ab', () => {
    const out = mapZvooveToCandiq({
      ...FIXTURE_CANDIDATE_BASIC,
      firstName: 'A'.repeat(500),
    })
    expect(out.firstName.length).toBeLessThanOrEqual(120)
  })

  it('Notes enthalten zvoove-ID + Tags fuer Audit', () => {
    const out = mapZvooveToCandiq(FIXTURE_CANDIDATE_BASIC)
    expect(out.notes).toContain('zv_001')
    expect(out.notes).toContain('ref-check')
  })

  it('Minimal-Profile (kein E-Mail, kein Tel) klappt ohne Crash', () => {
    const out = mapZvooveToCandiq(FIXTURE_CANDIDATE_MINIMAL)
    expect(out.email).toBeNull()
    expect(out.phone).toBeNull()
  })
})

describe('mapZvooveExperiencesToCheckDrafts', () => {
  it('mappt Experiences auf Check-Drafts', () => {
    const drafts = mapZvooveExperiencesToCheckDrafts(FIXTURE_CANDIDATE_BASIC)
    expect(drafts).toHaveLength(2)
    expect(drafts[0].employerName).toBe('SalesPro GmbH')
    expect(drafts[0].position).toBe('Senior Sales Lead')
  })

  it('liefert KEINE employerEmail/Phone — kommen vom Bewerber, nicht aus zvoove', () => {
    const drafts = mapZvooveExperiencesToCheckDrafts(FIXTURE_CANDIDATE_BASIC)
    for (const d of drafts) {
      expect((d as any).employerEmail).toBeUndefined()
      expect((d as any).employerPhone).toBeUndefined()
    }
  })

  it('filtert leere Experiences raus', () => {
    const drafts = mapZvooveExperiencesToCheckDrafts({
      ...FIXTURE_CANDIDATE_BASIC,
      experiences: [
        { company: '', jobTitle: 'Sales', startDate: null, endDate: null },
        { company: 'OK GmbH', jobTitle: '', startDate: null, endDate: null },
        { company: 'Valid GmbH', jobTitle: 'Lead', startDate: null, endDate: null },
      ],
    })
    expect(drafts).toHaveLength(1)
    expect(drafts[0].employerName).toBe('Valid GmbH')
  })
})

describe('hashZvooveProfile (Idempotenz)', () => {
  it('selbes Profil → selber Hash', () => {
    const h1 = hashZvooveProfile(FIXTURE_CANDIDATE_BASIC)
    const h2 = hashZvooveProfile({ ...FIXTURE_CANDIDATE_BASIC })
    expect(h1).toBe(h2)
  })

  it('Aenderung in einem Feld → anderer Hash', () => {
    const h1 = hashZvooveProfile(FIXTURE_CANDIDATE_BASIC)
    const h2 = hashZvooveProfile({ ...FIXTURE_CANDIDATE_BASIC, position: 'Anderes' })
    expect(h1).not.toBe(h2)
  })

  it('updatedAt-Aenderung allein triggert KEINEN Hash-Change (sonst Endlos-Resync)', () => {
    const h1 = hashZvooveProfile(FIXTURE_CANDIDATE_BASIC)
    const h2 = hashZvooveProfile({
      ...FIXTURE_CANDIDATE_BASIC,
      updatedAt: '2030-01-01T00:00:00.000Z',
    })
    expect(h1).toBe(h2)
  })
})

// ── Consent-Guard (sicherheitskritisch) ──────────────────────────────────

describe('Consent-Guard — der wichtigste Test', () => {
  it('Defaults haben gdprConsent=false', () => {
    expect(ZVOOVE_IMPORT_DEFAULTS.candidate.gdprConsent).toBe(false)
  })

  it('Defaults haben cvStatus=AWAITING_CONSENT', () => {
    expect(ZVOOVE_IMPORT_DEFAULTS.document.cvStatus).toBe('AWAITING_CONSENT')
  })

  it('Defaults haben candidate.status=PENDING (kein Reviewer-Zugriff)', () => {
    expect(ZVOOVE_IMPORT_DEFAULTS.candidate.status).toBe('PENDING')
  })

  it('Defaults haben referenceCheck.status=OPEN (NIE direkt IN_REVIEW)', () => {
    expect(ZVOOVE_IMPORT_DEFAULTS.referenceCheck.status).toBe('OPEN')
  })

  it('assertConsentSafeCandidateInput WIRFT bei gdprConsent=true', () => {
    expect(() => assertConsentSafeCandidateInput({ gdprConsent: true })).toThrow(/gdprConsent/)
  })

  it('assertConsentSafeCandidateInput WIRFT bei status != PENDING', () => {
    expect(() => assertConsentSafeCandidateInput({ status: 'CONSENT_GIVEN' })).toThrow(/status/)
    expect(() => assertConsentSafeCandidateInput({ status: 'IN_REVIEW' })).toThrow(/status/)
  })

  it('assertConsentSafeCandidateInput erlaubt PENDING + false', () => {
    expect(() =>
      assertConsentSafeCandidateInput({ gdprConsent: false, status: 'PENDING' }),
    ).not.toThrow()
  })

  it('assertConsentSafeCheckStatus erlaubt NUR OPEN', () => {
    expect(() => assertConsentSafeCheckStatus('OPEN')).not.toThrow()
    expect(() => assertConsentSafeCheckStatus('IN_REVIEW')).toThrow(/NICHT erlaubt/)
    expect(() => assertConsentSafeCheckStatus('COMPLETED')).toThrow(/NICHT erlaubt/)
  })
})

// ── MockZvooveClient ─────────────────────────────────────────────────────

describe('MockZvooveClient', () => {
  let client: MockZvooveClient
  beforeEach(() => {
    client = new MockZvooveClient([FIXTURE_CANDIDATE_BASIC, FIXTURE_CANDIDATE_MINIMAL])
  })

  it('validateConnection liefert ok=true', async () => {
    const r = await client.validateConnection()
    expect(r.ok).toBe(true)
  })

  it('failValidationOnce simuliert 401', async () => {
    client.failValidationOnce()
    const r = await client.validateConnection()
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(401)
      expect(r.reason).toBe('invalid_api_key')
    }
  })

  it('listCandidatesForCheck respektiert limit', async () => {
    const r = await client.listCandidatesForCheck({ limit: 1 })
    expect(r).toHaveLength(1)
  })

  it('listCandidatesForCheck respektiert since-Filter', async () => {
    const r = await client.listCandidatesForCheck({
      since: new Date('2026-06-13T00:00:00.000Z'),
    })
    expect(r).toHaveLength(1)
    expect(r[0].id).toBe('zv_001') // basic ist neuer, minimal aelter
  })

  it('pushVerificationResult speichert Payload', async () => {
    const payload = {
      candidateId: 'zv_001',
      result: 'VERIFIED',
      reportUrl: 'https://candiq.de/report/check/abc',
      completedAt: '2026-06-18T15:00:00.000Z',
    }
    await client.pushVerificationResult(payload)
    expect(client.pushed).toHaveLength(1)
    expect(client.pushed[0]).toMatchObject(payload)
  })
})

// ── Crypto-Helper ────────────────────────────────────────────────────────

describe('AES-256-GCM crypto helper', () => {
  beforeEach(() => {
    // 32-Byte hex Test-Key. NICHT der Production-Key.
    process.env.INTEGRATION_ENC_KEY =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  })

  it('encrypt + decrypt round-trip', () => {
    const plain = 'my-zvoove-api-key-12345'
    const env = encryptSecret(plain)
    expect(env).not.toContain(plain)
    expect(decryptSecret(env)).toBe(plain)
  })

  it('verschiedene IVs → unterschiedlicher Ciphertext fuer gleichen Input', () => {
    const a = encryptSecret('same')
    const b = encryptSecret('same')
    expect(a).not.toBe(b)
    expect(decryptSecret(a)).toBe('same')
    expect(decryptSecret(b)).toBe('same')
  })

  it('Tampering am Ciphertext wird erkannt (AuthTag)', () => {
    const env = encryptSecret('original')
    const [iv, tag, ct] = env.split('.')
    const tampered = `${iv}.${tag}.${Buffer.from('x').toString('base64')}`
    expect(() => decryptSecret(tampered)).toThrow()
  })

  it('fingerprintSecret maskiert Mittelteil', () => {
    expect(fingerprintSecret('re_abcdefghijklmnop')).toBe('re_a…mnop')
    expect(fingerprintSecret('short')).toBe('••••')
  })

  it('decryptSecret wirft bei kaputtem Envelope', () => {
    expect(() => decryptSecret('not.an.envelope.too.many')).toThrow()
    expect(() => decryptSecret('one-part-only')).toThrow()
  })
})

// ── Feature-Flag ─────────────────────────────────────────────────────────

describe('Feature-Flags', () => {
  it('isZvooveEnabled default false', () => {
    delete process.env.INTEGRATION_ZVOOVE_ENABLED
    expect(isZvooveEnabled()).toBe(false)
  })

  it('isZvooveEnabled true bei "true"', () => {
    process.env.INTEGRATION_ZVOOVE_ENABLED = 'true'
    expect(isZvooveEnabled()).toBe(true)
  })

  it('isFlagEnabled akzeptiert truthy-Varianten', () => {
    for (const v of ['true', '1', 'yes', 'on', 'TRUE', ' true ']) {
      process.env.TEST_FLAG = v
      expect(isFlagEnabled('TEST_FLAG')).toBe(true)
    }
    for (const v of ['false', '0', 'no', 'off', '']) {
      process.env.TEST_FLAG = v
      expect(isFlagEnabled('TEST_FLAG')).toBe(false)
    }
  })
})
