/**
 * lib/integrations/zvoove/client.ts
 *
 * Typisierter HTTP-Client für zvoove Recruit. Pro Tenant instanziiert mit
 * eigenem `baseUrl` + `apiKey`. Eigenschaften:
 *
 *  - Retry mit Exponential-Backoff bei 429/5xx (max 3 Versuche)
 *  - Strukturierte Fehler (kein Throw mit losem string)
 *  - KEIN Logging von API-Keys oder PII — nur Endpoint + HTTP-Status
 *  - Timeout 15s pro Request, fail-fast bei Tenant-Down
 *
 * TODO(zvoove-doc): Alle Endpoint-Pfade sind PLATZHALTER. Verifikation
 * gegen die Per-Tenant Swagger-Doku unter `${baseUrl}/swagger`.
 */

import { logger } from '@/lib/logger'
import type {
  ZvooveCandidateProfile,
  ZvooveClient,
  ZvooveClientConfig,
  ZvooveVerificationPayload,
} from './types'

const DEFAULT_TIMEOUT_MS = 15_000
const MAX_RETRIES = 3
// Backoff: 500ms, 1.5s, 4.5s
const BACKOFF_BASE_MS = 500

export class HttpZvooveClient implements ZvooveClient {
  constructor(private cfg: ZvooveClientConfig) {
    if (!cfg.baseUrl) throw new Error('ZvooveClient: baseUrl fehlt')
    if (!cfg.apiKey) throw new Error('ZvooveClient: apiKey fehlt')
  }

  async validateConnection(): Promise<
    { ok: true } | { ok: false; status: number; reason: string }
  > {
    // TODO(zvoove-doc): exakter „who am I"-Endpoint aus Swagger
    const r = await this.raw('GET', '/api/v1/me', null, { retries: 1 })
    if (r.ok) return { ok: true }
    return { ok: false, status: r.status, reason: r.reason ?? 'unknown' }
  }

  async listCandidatesForCheck(opts?: {
    since?: Date
    limit?: number
  }): Promise<ZvooveCandidateProfile[]> {
    // TODO(zvoove-doc): exakter Endpoint + Filter-Parameter.
    // Annahme: tag-basiertes Filter (z.B. `?tag=ref-check`)
    const params = new URLSearchParams()
    params.set('tag', 'ref-check')
    if (opts?.since) params.set('updatedAfter', opts.since.toISOString())
    if (opts?.limit) params.set('limit', String(opts.limit))
    const r = await this.raw('GET', `/api/v1/candidates?${params}`, null)
    if (!r.ok) {
      throw new ZvooveApiError('listCandidatesForCheck', r.status, r.reason)
    }
    // TODO(zvoove-doc): Response-Wrapper (z.B. `{ data: [...] }` vs. Array)
    const body = r.body as unknown
    return Array.isArray(body) ? (body as ZvooveCandidateProfile[]) : []
  }

  async getCandidate(id: string): Promise<ZvooveCandidateProfile | null> {
    const r = await this.raw('GET', `/api/v1/candidates/${encodeURIComponent(id)}`, null)
    if (r.status === 404) return null
    if (!r.ok) {
      throw new ZvooveApiError('getCandidate', r.status, r.reason)
    }
    return r.body as ZvooveCandidateProfile
  }

  async pushVerificationResult(payload: ZvooveVerificationPayload): Promise<{ ok: boolean }> {
    // TODO(zvoove-doc): exakter Endpoint — vermutlich Note/Comment am Bewerber
    // oder Custom-Field-Update via PATCH.
    const r = await this.raw(
      'POST',
      `/api/v1/candidates/${encodeURIComponent(payload.candidateId)}/notes`,
      {
        type: 'reference_check_result',
        result: payload.result,
        url: payload.reportUrl,
        completedAt: payload.completedAt,
        note: payload.note ?? null,
      },
    )
    if (!r.ok) {
      throw new ZvooveApiError('pushVerificationResult', r.status, r.reason)
    }
    return { ok: true }
  }

  /**
   * Low-Level HTTP — alle Public-Methods gehen hier durch.
   * Retry, Backoff, Timeout. NIE den apiKey loggen.
   */
  private async raw(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body: unknown,
    opts?: { retries?: number },
  ): Promise<{ ok: boolean; status: number; body: unknown; reason?: string }> {
    const retries = opts?.retries ?? MAX_RETRIES
    const url = `${this.cfg.baseUrl.replace(/\/$/, '')}${path}`

    for (let attempt = 0; attempt < retries; attempt++) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
      try {
        const res = await fetch(url, {
          method,
          headers: {
            // TODO(zvoove-doc): exaktes Auth-Header-Schema (Bearer vs. X-API-Key)
            // aus Swagger verifizieren. Annahme: X-API-Key.
            'X-API-Key': this.cfg.apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: body == null ? undefined : JSON.stringify(body),
          signal: controller.signal,
        })
        clearTimeout(timeout)

        // 429 oder 5xx → retry mit Backoff
        if ((res.status === 429 || res.status >= 500) && attempt < retries - 1) {
          const delay = BACKOFF_BASE_MS * Math.pow(3, attempt)
          // STRUKTURIERTES Log — niemals apiKey, niemals URL mit Token
          logger.warn('zvoove_http_retry', {
            method,
            path,
            status: res.status,
            attempt: attempt + 1,
            delayMs: delay,
          })
          await sleep(delay)
          continue
        }

        const text = await res.text()
        const parsed = safeJson(text)
        return {
          ok: res.ok,
          status: res.status,
          body: parsed,
          reason: res.ok ? undefined : extractReason(parsed) ?? text.slice(0, 200),
        }
      } catch (err: any) {
        clearTimeout(timeout)
        if (attempt < retries - 1) {
          const delay = BACKOFF_BASE_MS * Math.pow(3, attempt)
          logger.warn('zvoove_http_exception_retry', {
            method,
            path,
            attempt: attempt + 1,
            error: err?.name ?? 'unknown',
          })
          await sleep(delay)
          continue
        }
        return {
          ok: false,
          status: 0,
          body: null,
          reason: err?.name === 'AbortError' ? 'timeout' : (err?.message ?? 'network_error'),
        }
      }
    }
    return { ok: false, status: 0, body: null, reason: 'retries_exhausted' }
  }
}

export class ZvooveApiError extends Error {
  constructor(
    public operation: string,
    public status: number,
    public reason?: string,
  ) {
    super(`zvoove ${operation} failed: ${status} ${reason ?? ''}`.trim())
    this.name = 'ZvooveApiError'
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function safeJson(text: string): unknown {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function extractReason(parsed: unknown): string | undefined {
  if (parsed && typeof parsed === 'object') {
    const p = parsed as Record<string, unknown>
    if (typeof p.error === 'string') return p.error
    if (typeof p.message === 'string') return p.message
  }
  return undefined
}
