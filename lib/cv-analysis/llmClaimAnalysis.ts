import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { z } from 'zod'
import {
  candidateInputSchema,
  llmClaimAnalysisSchema,
  parsedCvSchema,
  type CandidateInput,
  type LlmClaimAnalysis,
  type ParsedCv,
} from './types'

export const CV_ANALYSIS_SYSTEM_PROMPT = `Du bist ein CV Fabrication & Consistency Analyzer für candiq.
Ziel: Entscheider:innen dabei helfen, faktische Verifizierungsrisiken im Referenz-Call zu priorisieren.

Harte Guardrails:
- Erkenne NICHT, ob ein Text mit KI geschrieben wurde.
- Bewerte ausschließlich faktische Plausibilität, Verifizierbarkeit, Widersprüche und Nachweisrisiko.
- Bewerte NIEMALS Schreibstil, Sprachqualität, Grammatik, Fluency, Rechtschreibung, Tonalität oder Formatierung.
- Ignoriere und verwende NIEMALS geschützte Merkmale: Geschlecht, Alter, Herkunft, ethnische Zuschreibung, Religion, Behinderung, Foto, Namens-Herkunft, Familienstand, Schwangerschaft oder ähnliche AGG/DSGVO-sensitive Merkmale.
- Gib keine automatische Einstellungsentscheidung und kein Auto-Reject aus. Output ist nur Human-in-the-loop Entscheidungsunterstützung.
- Jede Flag/Behauptung braucht eine kurze, konkrete reason.
- Wenn Informationen fehlen, markiere Verifizierungsbedarf statt zu spekulieren.

Antworte ausschließlich als JSON, passend zum vorgegebenen Schema.`

const EMPTY_ANALYSIS: LlmClaimAnalysis = {
  claims: [],
  checklist: ['Referenzgeber:in bitten, Beschäftigungszeitraum, Titel und Berichtslinie faktisch zu bestätigen.'],
  explanations: ['LLM-Analyse nicht verfügbar oder nicht schema-konform; deterministische und externe Checks bleiben maßgeblich.'],
}

function sanitizeRawCvTextForLlm(text: string): string {
  const protectedContextPattern = /\b(age|alter|geburtsdatum|geboren|birth|date of birth|nationality|staatsangehörigkeit|herkunft|origin|ethnicity|religion|geschlecht|gender|foto|photo|bild|familienstand|marital|schwanger|pregnan|behinderung|disability)\b/i
  return text
    .split(/\r?\n/)
    .filter((line) => !protectedContextPattern.test(line))
    .join('\n')
}

function jsonFromText(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  return JSON.parse(fenced ? fenced[1] : trimmed)
}

async function callOpenAI(system: string, user: string): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await client.chat.completions.create({
    model: process.env.CV_ANALYSIS_OPENAI_MODEL ?? 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
  return response.choices[0]?.message?.content ?? '{}'
}

async function callAnthropic(system: string, user: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await client.messages.create({
    model: process.env.CV_ANALYSIS_ANTHROPIC_MODEL ?? 'claude-haiku-4-5',
    temperature: 0,
    max_tokens: 2000,
    system,
    messages: [{ role: 'user', content: user }],
  })
  return response.content.map((part) => (part.type === 'text' ? part.text : '')).join('\n')
}

async function callConfiguredLlm(system: string, user: string): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) return callAnthropic(system, user)
  if (process.env.OPENAI_API_KEY) return callOpenAI(system, user)
  return '{}'
}

async function parseWithSchema<T>(schema: z.ZodSchema<T>, system: string, user: string, fallback: T): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    let text: string
    try {
      text = await callConfiguredLlm(system, user)
    } catch (err) {
      // LLM-API-Fehler (ungültiger Key, retired Model, Netz) darf den
      // Gesamt-Report nicht killen: deterministische + externe Checks
      // bleiben maßgeblich, Retry mit gleichem Fehlerbild wäre sinnlos.
      console.error('cv-analysis_llm_call_failed', err)
      return fallback
    }
    let json: unknown
    try {
      json = jsonFromText(text)
    } catch {
      json = {}
    }
    const parsed = schema.safeParse(json)
    if (parsed.success) return parsed.data
    user = `${user}\n\nVorherige Antwort war nicht schema-konform. Antworte jetzt ausschließlich mit gültigem JSON für das Schema.`
  }
  return fallback
}

export async function parseRawCvText(rawCvText?: string): Promise<ParsedCv> {
  if (!rawCvText?.trim()) return { stations: [], education: [], certifications: [], referees: [] }

  const sanitizedRawCvText = sanitizeRawCvTextForLlm(rawCvText).slice(0, 30000)
  const user = `Extrahiere ausschließlich faktische CV-Daten aus dem Rohtext. Entferne/ignoriere geschützte Merkmale und bewerte nichts. JSON-Schema: {"stations":[{"company":"","title":"","startDate":"","endDate":"","location":""}],"education":[{"institution":"","degree":"","startDate":"","endDate":""}],"certifications":[{"name":"","issuer":"","year":2024}],"referees":[{"name":"","company":"","role":"","email":"","phone":""}]}\n\nRoh-CV ohne erkannte geschützte Kontextzeilen:\n${sanitizedRawCvText}`

  return parseWithSchema(parsedCvSchema, CV_ANALYSIS_SYSTEM_PROMPT, user, {
    stations: [],
    education: [],
    certifications: [],
    referees: [],
  })
}

export function mergeParsedCvInput(input: CandidateInput, parsed: ParsedCv): CandidateInput {
  return candidateInputSchema.parse({
    ...input,
    stations: input.stations.length > 0 ? input.stations : parsed.stations,
    education: input.education.length > 0 ? input.education : parsed.education,
    certifications: input.certifications && input.certifications.length > 0 ? input.certifications : parsed.certifications,
    referees: input.referees.length > 0 ? input.referees : parsed.referees,
  })
}

export async function runLlmClaimAnalysis(input: CandidateInput): Promise<LlmClaimAnalysis> {
  const { rawCvText: _rawCvText, ...llmSafeInput } = input
  const user = `Analysiere verifizierbare faktische Behauptungen und priorisiere Referenz-Call-Fragen. Keine Stil-/Sprach-/KI-Erkennung. Keine geschützten Merkmale. JSON-Schema: {"claims":[{"claim":"","type":"employment|education|certification|responsibility|achievement|referee","severity":"low|medium|high","reason":"kurz und faktisch","verificationPriority":"low|medium|high"}],"checklist":["konkrete Frage"],"explanations":["kurze Erklärung"]}\n\nStrukturierte CV-Daten ohne Rohtext und ohne geschützte Kontextfelder:\n${JSON.stringify(llmSafeInput)}`

  return parseWithSchema(llmClaimAnalysisSchema, CV_ANALYSIS_SYSTEM_PROMPT, user, EMPTY_ANALYSIS)
}
