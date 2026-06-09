import { candidateInputSchema, riskReportSchema, type CandidateInput, type RiskReport } from './types'
import { runDeterministicChecks } from './deterministicChecks'
import { runExternalChecks, type ExternalCheckAdapter } from './externalChecks'
import { mergeParsedCvInput, parseRawCvText, runLlmClaimAnalysis } from './llmClaimAnalysis'
import { buildRiskReport } from './score'

export type AnalyzeCvOptions = {
  externalAdapter?: ExternalCheckAdapter
  now?: Date
}

export async function analyzeCv(input: CandidateInput, options: AnalyzeCvOptions = {}): Promise<RiskReport> {
  const validated = candidateInputSchema.parse(input)
  if (!validated.consentGiven) {
    throw new Error('CONSENT_REQUIRED')
  }

  const parsed = await parseRawCvText(validated.rawCvText)
  const normalizedInput = mergeParsedCvInput(validated, parsed)

  const deterministicFlags = runDeterministicChecks(normalizedInput, options.now)
  const externalFlags = await runExternalChecks(normalizedInput, options.externalAdapter)
  const llmAnalysis = await runLlmClaimAnalysis(normalizedInput)
  const llmFlags = llmAnalysis.claims.map((claim) => ({
    claim: claim.claim,
    type: claim.type,
    severity: claim.severity,
    reason: claim.reason,
    source: 'llm' as const,
  }))

  return riskReportSchema.parse(
    buildRiskReport([...deterministicFlags, ...externalFlags, ...llmFlags], llmAnalysis.checklist, llmAnalysis.explanations),
  )
}

export * from './types'
export * from './deterministicChecks'
export * from './externalChecks'
export * from './llmClaimAnalysis'
export * from './score'
