import { describe, expect, it, vi } from 'vitest'
import { candidateInputSchema, riskReportSchema } from '@/lib/cv-analysis/types'
import { runDeterministicChecks } from '@/lib/cv-analysis/deterministicChecks'
import { runExternalChecks, type ExternalCheckAdapter } from '@/lib/cv-analysis/externalChecks'
import { buildRiskReport } from '@/lib/cv-analysis/score'
import { fabricatedCv } from './fixtures/fabricatedCv'
import { cleanCv } from './fixtures/cleanCv'

const lookupAdapter: ExternalCheckAdapter = {
  async lookupCompany(company) {
    if (company === 'Beta AG') return { status: 'unknown', reason: 'Test-Lookup ohne verifizierten Treffer.' }
    return { status: 'verified', domain: 'example.com', reason: 'Test-Lookup verifiziert.' }
  },
}

describe('CV analysis schemas', () => {
  it('validates candidate input and rejects missing consent', () => {
    expect(candidateInputSchema.parse(cleanCv).consentGiven).toBe(true)
    expect(candidateInputSchema.safeParse({ ...cleanCv, consentGiven: 'yes' }).success).toBe(false)
  })

  it('validates risk reports and requires reasons on every flag', () => {
    const report = buildRiskReport(
      [{ claim: 'Future role', type: 'timeline_future_date', severity: 'high', reason: 'End date is in the future.', source: 'deterministic' }],
      ['Confirm dates with the employer.'],
      ['Human review only.'],
    )

    expect(riskReportSchema.parse(report).flags.every((flag) => flag.reason.length > 0)).toBe(true)
  })
})

describe('deterministic CV checks', () => {
  it('flags fabricated timeline patterns without style or AI-writing analysis', () => {
    const flags = runDeterministicChecks(fabricatedCv, new Date('2026-06-09T00:00:00.000Z'))

    expect(flags.some((flag) => flag.type === 'timeline_future_date')).toBe(true)
    expect(flags.some((flag) => flag.type === 'timeline_overlap')).toBe(true)
    expect(flags.some((flag) => flag.type === 'title_duration_plausibility')).toBe(true)
    expect(flags.every((flag) => flag.reason.trim().length > 0)).toBe(true)
    expect(flags.map((flag) => `${flag.type} ${flag.reason}`).join(' ')).not.toMatch(/grammar|fluency|style|ki-?text/i)
  })

  it('does not flag a clean continuous CV timeline', () => {
    const flags = runDeterministicChecks(cleanCv, new Date('2026-06-09T00:00:00.000Z'))

    expect(flags).toEqual([])
  })
})

describe('external CV checks', () => {
  it('flags freemail referees and keeps every reason explainable', async () => {
    const flags = await runExternalChecks(fabricatedCv, lookupAdapter)

    expect(flags.some((flag) => flag.type === 'referee_email_risk')).toBe(true)
    expect(flags.every((flag) => flag.reason.trim().length > 0)).toBe(true)
  })
})

describe('LLM claim analysis resilience', () => {
  it('falls back instead of throwing when the LLM API call fails', async () => {
    vi.resetModules()
    vi.stubEnv('CV_ANALYSIS_LLM_ENABLED', 'true') // Flag AN → Anthropic-Pfad wird erreicht
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-invalid')
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class {
        messages = {
          create: async () => {
            throw new Error('404 not_found_error: model not found')
          },
        }
      },
    }))

    const { runLlmClaimAnalysis } = await import('@/lib/cv-analysis/llmClaimAnalysis')
    const analysis = await runLlmClaimAnalysis(candidateInputSchema.parse(cleanCv))

    expect(analysis.claims).toEqual([])
    expect(analysis.checklist.length).toBeGreaterThan(0)

    vi.doUnmock('@anthropic-ai/sdk')
    vi.unstubAllEnvs()
  })

  it('R4-Gate: Flag OFF → KEIN LLM-Call, auch mit gesetztem API-Key', async () => {
    vi.resetModules()
    // Flag NICHT gesetzt (= off), aber Key vorhanden:
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-should-not-be-used')
    const createSpy = vi.fn()
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class {
        messages = { create: createSpy }
      },
    }))

    const { runLlmClaimAnalysis } = await import('@/lib/cv-analysis/llmClaimAnalysis')
    const analysis = await runLlmClaimAnalysis(candidateInputSchema.parse(cleanCv))

    // Kein CV-Inhalt an die LLM-API — der Client wurde nie aufgerufen.
    expect(createSpy).not.toHaveBeenCalled()
    // Deterministische Checks laufen trotzdem (Report bleibt nutzbar).
    expect(analysis.claims).toEqual([])
    expect(analysis.checklist.length).toBeGreaterThan(0)

    vi.doUnmock('@anthropic-ai/sdk')
    vi.unstubAllEnvs()
  })
})
