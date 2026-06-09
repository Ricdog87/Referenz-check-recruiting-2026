import type { ClaimFlag, RiskReport } from './types'

const SOURCE_WEIGHTS = {
  deterministic: 1.2,
  external: 1,
  llm: 0.8,
} as const

const SEVERITY_POINTS = {
  low: 8,
  medium: 18,
  high: 32,
} as const

function scoreForFlags(flags: ClaimFlag[]): number {
  const raw = flags.reduce((sum, flag) => sum + SEVERITY_POINTS[flag.severity] * SOURCE_WEIGHTS[flag.source], 0)
  return Math.min(100, Math.round(raw))
}

function ragFor(score: number): RiskReport['rag'] {
  if (score >= 70) return 'red'
  if (score >= 35) return 'amber'
  return 'green'
}

function uniqueChecklist(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean))).slice(0, 20)
}

export function buildRiskReport(flags: ClaimFlag[], checklist: string[], explanations: string[]): RiskReport {
  const cleanFlags = flags.filter((flag) => flag.reason.trim().length > 0)
  const subScores = {
    timeline: scoreForFlags(cleanFlags.filter((flag) => flag.source === 'deterministic')),
    employer: scoreForFlags(cleanFlags.filter((flag) => flag.type.includes('employer'))),
    referee: scoreForFlags(cleanFlags.filter((flag) => flag.type.includes('referee'))),
    claims: scoreForFlags(cleanFlags.filter((flag) => flag.source === 'llm')),
  }
  const riskScore = Math.min(
    100,
    Math.round(subScores.timeline * 0.35 + subScores.employer * 0.2 + subScores.referee * 0.25 + subScores.claims * 0.2),
  )

  const defaultChecklist = cleanFlags
    .filter((flag) => flag.severity !== 'low')
    .slice(0, 10)
    .map((flag) => `${flag.claim}: ${flag.reason}`)

  return {
    riskScore,
    rag: ragFor(riskScore),
    subScores,
    flags: cleanFlags,
    verificationChecklist: uniqueChecklist([...checklist, ...defaultChecklist]),
    explanations: uniqueChecklist([
      ...explanations,
      'Der Report ist Entscheidungsunterstützung: keine automatische Ablehnung, sondern priorisierte Prüfhinweise für menschliche Reviewer.',
    ]),
  }
}
