/**
 * lib/integrations/zvoove/__mocks__/MockZvooveClient.ts
 *
 * In-Memory-Implementation des ZvooveClient-Interfaces für Tests.
 * Akzeptiert vorgegebene Fixtures, zählt Calls, simuliert 429/5xx auf Wunsch.
 *
 * Bewusst KEIN vi.mock() — wir injizieren die Instanz, damit die Tests
 * deterministisch und framework-agnostisch sind.
 */

import type {
  ZvooveCandidateProfile,
  ZvooveClient,
  ZvooveVerificationPayload,
} from '../types'

export class MockZvooveClient implements ZvooveClient {
  public calls: Array<{ method: string; args: unknown }> = []
  public pushed: ZvooveVerificationPayload[] = []
  private candidates: Map<string, ZvooveCandidateProfile>
  private failNextValidate = false

  constructor(initial: ZvooveCandidateProfile[] = []) {
    this.candidates = new Map(initial.map((c) => [c.id, c]))
  }

  failValidationOnce() {
    this.failNextValidate = true
  }

  async validateConnection() {
    this.calls.push({ method: 'validateConnection', args: null })
    if (this.failNextValidate) {
      this.failNextValidate = false
      return { ok: false as const, status: 401, reason: 'invalid_api_key' }
    }
    return { ok: true as const }
  }

  async listCandidatesForCheck(opts?: { since?: Date; limit?: number }) {
    this.calls.push({ method: 'listCandidatesForCheck', args: opts ?? null })
    let arr = Array.from(this.candidates.values())
    if (opts?.since) {
      arr = arr.filter((c) => new Date(c.updatedAt) >= opts.since!)
    }
    if (opts?.limit) arr = arr.slice(0, opts.limit)
    return arr
  }

  async getCandidate(id: string) {
    this.calls.push({ method: 'getCandidate', args: { id } })
    return this.candidates.get(id) ?? null
  }

  async pushVerificationResult(payload: ZvooveVerificationPayload) {
    this.calls.push({ method: 'pushVerificationResult', args: payload })
    this.pushed.push(payload)
    return { ok: true }
  }
}

// ── Fixtures ─────────────────────────────────────────────────────────────

export const FIXTURE_CANDIDATE_BASIC: ZvooveCandidateProfile = {
  id: 'zv_001',
  firstName: 'Anna',
  lastName: 'Mustermann',
  email: 'anna.mustermann@example.com',
  phone: '+49 30 1234567',
  position: 'Senior Sales Lead',
  status: 'IN_REVIEW',
  tags: ['ref-check'],
  createdAt: '2026-06-10T10:00:00.000Z',
  updatedAt: '2026-06-15T14:30:00.000Z',
  experiences: [
    {
      company: 'SalesPro GmbH',
      jobTitle: 'Senior Sales Lead',
      startDate: '2021-05-01',
      endDate: '2025-03-31',
    },
    {
      company: 'Vertrieb GmbH',
      jobTitle: 'Account Executive',
      startDate: '2018-03-01',
      endDate: '2021-04-30',
    },
  ],
}

export const FIXTURE_CANDIDATE_MINIMAL: ZvooveCandidateProfile = {
  id: 'zv_002',
  firstName: 'Tim',
  lastName: 'Beispiel',
  email: null,
  phone: null,
  position: 'UX Researcher',
  status: 'NEW',
  tags: ['ref-check'],
  createdAt: '2026-06-12T09:00:00.000Z',
  updatedAt: '2026-06-12T09:00:00.000Z',
}
