/**
 * candiq AI-Concierge — Sales-Intent-Analyse + Hot-Lead-Alert.
 *
 * Wird vom AIConcierge-Widget per fire-and-forget aufgerufen, NACHDEM die
 * gestreamte Concierge-Antwort fertig ist. Workflow:
 *
 *   1. Conversation entgegennehmen (max 20 Messages, sanitized)
 *   2. Anthropic Messages API mit `capture_lead`-Tool und tool_choice=tool
 *      aufrufen (Haiku, non-streaming, low max_tokens)
 *   3. Tool-Use-Input parsen + normalisieren
 *   4. Bei Score >= HOT_LEAD_THRESHOLD: Mail an LEAD_ALERT_RECIPIENT via
 *      bestehendes lib/email.ts (Resend bei prod, AuditLog-Log sonst)
 *
 * Datenschutz:
 *   - Keine DB-Persistenz der Conversation
 *   - Nur Hot-Leads >= 60 triggern Mail
 *   - Visitor-IP wird nicht in der Mail mitgesendet (DSGVO-Minimierung)
 *   - Rate-Limit: 6 Analysen / 10 Minuten pro IP — verhindert Mail-Floods
 */

import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email'
import {
  CAPTURE_LEAD_TOOL,
  INTENT_SYSTEM_PROMPT,
  HOT_LEAD_THRESHOLD,
  LEAD_ALERT_RECIPIENT,
  buildLeadAlertEmail,
  type LeadInput,
  type LeadIntent,
} from '@/lib/chat/lead-scoring'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const INTENT_MODEL =
  process.env.ANTHROPIC_INTENT_MODEL ?? 'claude-haiku-4-5-20251001'

// ─────────────────────────────────────────────────────────────────
// Rate-Limit pro IP (6 Analysen / 10 Minuten)
// ─────────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 10 * 60 * 1000
  const limit = 6
  const entry = rateLimitMap.get(ip)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

// ─────────────────────────────────────────────────────────────────
// Pro IP Score-Memoization fuer 5 Minuten — verhindert doppelte
// Hot-Lead-Mails, wenn der Visitor mehrfach scrollt/sendet.
// ─────────────────────────────────────────────────────────────────
const lastAlertMap = new Map<string, { score: number; sentAt: number }>()
const ALERT_COOLDOWN_MS = 5 * 60 * 1000

type ChatRole = 'user' | 'assistant'
type ChatMessage = { role: ChatRole; content: string }

function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return []
  return raw
    .slice(-20)
    .map((m: any) => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      content: String(m?.content ?? '').slice(0, 4000),
    }))
    .filter((m) => m.content.length > 0) as ChatMessage[]
}

function clampScore(n: unknown): number {
  const v = typeof n === 'number' ? n : parseInt(String(n ?? 0), 10)
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v)))
}

const VALID_INTENTS: LeadIntent[] = [
  'research',
  'evaluation',
  'demo_interest',
  'pilot_interest',
  'purchase_ready',
  'support',
  'irrelevant',
]

function normalizeLead(raw: any, fallbackLang: 'de' | 'en'): LeadInput {
  const intent: LeadIntent = VALID_INTENTS.includes(raw?.intent)
    ? raw.intent
    : 'research'
  const lang: 'de' | 'en' = raw?.language === 'en' ? 'en' : fallbackLang
  return {
    score: clampScore(raw?.score),
    intent,
    summary: String(raw?.summary ?? '').slice(0, 600),
    language: lang,
    company_size_hint: raw?.company_size_hint
      ? String(raw.company_size_hint).slice(0, 120)
      : undefined,
    hires_per_month_hint: raw?.hires_per_month_hint
      ? String(raw.hires_per_month_hint).slice(0, 120)
      : undefined,
    industry_hint: raw?.industry_hint
      ? String(raw.industry_hint).slice(0, 120)
      : undefined,
    timing_hint: raw?.timing_hint
      ? String(raw.timing_hint).slice(0, 120)
      : undefined,
    email_provided:
      typeof raw?.email_provided === 'string' &&
      raw.email_provided.includes('@')
        ? raw.email_provided.trim().slice(0, 254)
        : undefined,
    key_signals: Array.isArray(raw?.key_signals)
      ? raw.key_signals
          .slice(0, 5)
          .map((s: any) => String(s ?? '').slice(0, 140))
          .filter((s: string) => s.length > 0)
      : [],
    recommended_next_action: raw?.recommended_next_action
      ? String(raw.recommended_next_action).slice(0, 240)
      : undefined,
  }
}

export async function POST(req: Request) {
  if (!ANTHROPIC_API_KEY) {
    // Soft-fail — nicht das Visitor-Erlebnis blocken
    return new Response(JSON.stringify({ skipped: 'no_api_key' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ skipped: 'rate_limited' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const messages = sanitizeMessages(body?.messages)
  if (messages.length < 2) {
    // Mindestens 1 User + 1 Assistant — sonst kein Signal
    return new Response(JSON.stringify({ skipped: 'too_short' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const pathname: string | null =
    typeof body?.currentPath === 'string'
      ? body.currentPath.slice(0, 200)
      : null
  const fallbackLang: 'de' | 'en' =
    pathname && pathname.startsWith('/en') ? 'en' : 'de'

  // ───────────────────────────────────────────────────────────────
  // Anthropic Messages API — Tool-Use mit forced choice
  // ───────────────────────────────────────────────────────────────
  let upstream: Response
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: INTENT_MODEL,
        max_tokens: 600,
        system: INTENT_SYSTEM_PROMPT,
        tools: [CAPTURE_LEAD_TOOL],
        tool_choice: { type: 'tool', name: CAPTURE_LEAD_TOOL.name },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Konversation zwischen Website-Visitor (candiq.de, aktuelle Page: ${
                  pathname ?? '/'
                }) und candiq-Concierge. Bewerte den Sales-Intent.\n\n${messages
                  .map(
                    (m) =>
                      `[${m.role === 'user' ? 'VISITOR' : 'CONCIERGE'}] ${
                        m.content
                      }`,
                  )
                  .join('\n\n')}`,
              },
            ],
          },
        ],
      }),
    })
  } catch (err) {
    logger.error('intent_anthropic_exception', err as any)
    return new Response(JSON.stringify({ skipped: 'anthropic_unreachable' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!upstream.ok) {
    const txt = await upstream.text().catch(() => '')
    logger.error('intent_anthropic_error', {
      status: upstream.status,
      body: txt.slice(0, 200),
    })
    return new Response(JSON.stringify({ skipped: 'anthropic_error' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const data = await upstream.json().catch(() => null)
  const blocks = Array.isArray(data?.content) ? data.content : []
  const toolUse = blocks.find(
    (b: any) =>
      b?.type === 'tool_use' && b?.name === CAPTURE_LEAD_TOOL.name && b?.input,
  )

  if (!toolUse) {
    logger.warn('intent_no_tool_use', { id: data?.id })
    return new Response(JSON.stringify({ skipped: 'no_tool_use' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const lead = normalizeLead(toolUse.input, fallbackLang)

  logger.info('intent_lead_scored', {
    score: lead.score,
    intent: lead.intent,
    pathname,
    has_email: Boolean(lead.email_provided),
  })

  // ───────────────────────────────────────────────────────────────
  // Hot-Lead-Alert: nur ab Threshold und mit Cooldown pro IP
  // ───────────────────────────────────────────────────────────────
  let alerted = false
  if (lead.score >= HOT_LEAD_THRESHOLD && lead.intent !== 'support') {
    const now = Date.now()
    const last = lastAlertMap.get(ip)
    const onCooldown =
      last &&
      now - last.sentAt < ALERT_COOLDOWN_MS &&
      lead.score - last.score < 15 // nur skippen wenn nicht deutlich heisser

    if (onCooldown) {
      logger.info('intent_alert_skipped_cooldown', {
        ip_hash: ip.slice(0, 6) + '…',
        prev_score: last!.score,
        cur_score: lead.score,
      })
    } else {
      const { subject, html, text } = buildLeadAlertEmail({
        lead,
        conversation: messages,
        pathname,
        userAgent: req.headers.get('user-agent'),
        referer: req.headers.get('referer'),
      })
      try {
        const result = await sendEmail({
          to: LEAD_ALERT_RECIPIENT,
          subject,
          html,
          text,
          category: 'ai_concierge_hot_lead',
        })
        if (result.ok) {
          alerted = true
          lastAlertMap.set(ip, { score: lead.score, sentAt: now })
          logger.info('intent_alert_sent', {
            score: lead.score,
            provider: result.provider,
          })
        } else {
          logger.warn('intent_alert_failed', { error: result.error })
        }
      } catch (err) {
        logger.error('intent_alert_exception', err as any)
      }
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      score: lead.score,
      intent: lead.intent,
      alerted,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
