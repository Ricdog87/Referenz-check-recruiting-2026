/**
 * candiq AI-Concierge — Sales-Intent-Detection (Lead-Scoring)
 *
 * Eigene Anthropic-Tool-Use-Schicht, die NACH dem Streaming der Concierge-
 * Antwort läuft. Die Hauptaufgabe ist klar getrennt:
 *
 *  1. /api/chat  → streamt die User-Antwort (Latenz-optimiert, kein Tooling)
 *  2. /api/chat/intent  → analysiert die Konversation strukturiert mit
 *     Claude Haiku + Tool-Use → ruft `capture_lead` mit BANT-Score 0-100.
 *
 * Vorteil: Streaming-UX bleibt sauber, Tool-Call liefert garantiert
 * strukturiertes JSON, und wir können günstig Haiku statt Sonnet nutzen.
 *
 * DSGVO-Hinweis: Wir speichern NICHT die Conversation. Wir nutzen sie
 * nur für die Lead-Bewertung im Moment der Anfrage. Bei Score >= 60 wird
 * ein interner Alert an r.serrano@recruiting-sg.de versandt — Visitor
 * wird darauf hingewiesen, dass kein Tracking stattfindet (siehe Footer
 * im AIConcierge-Widget). Der Alert ist transactional (Art. 6 Abs. 1
 * lit. f DSGVO — berechtigtes Interesse, Vertragsanbahnung).
 */

export type LeadIntent =
  | 'research'
  | 'evaluation'
  | 'demo_interest'
  | 'pilot_interest'
  | 'purchase_ready'
  | 'support'
  | 'irrelevant'

export type LeadInput = {
  score: number
  intent: LeadIntent
  summary: string
  language: 'de' | 'en'
  company_size_hint?: string
  hires_per_month_hint?: string
  industry_hint?: string
  timing_hint?: string
  email_provided?: string
  key_signals: string[]
  recommended_next_action?: string
}

/**
 * Anthropic Tool-Definition für `capture_lead`.
 *
 * Wird Claude im /api/chat/intent-Endpoint mitgegeben. Das Tool wird
 * IMMER aufgerufen — auch bei Score 0 — damit wir konsistent strukturierte
 * Daten zurück bekommen. Das ist über `tool_choice: { type: 'tool' }`
 * erzwungen.
 */
export const CAPTURE_LEAD_TOOL = {
  name: 'capture_lead',
  description:
    'Bewerte den Sales-Intent dieses candiq-Visitors basierend auf der Konversation. Wende strenge BANT-Heuristik an (Budget, Authority, Need, Timing). Wird IMMER aufgerufen — auch wenn der Visitor nur recherchiert oder Support-Fragen stellt. Score 0 ist OK für reine Wissensfragen ohne Kaufabsicht.',
  input_schema: {
    type: 'object' as const,
    properties: {
      score: {
        type: 'integer',
        minimum: 0,
        maximum: 100,
        description:
          'BANT-Score 0-100. 0-20 = reine Recherche/Support, 21-40 = Evaluierung, 41-60 = warm (Demo-/Pilot-Interesse), 61-80 = heiss (konkretes Projekt), 81-100 = kaufbereit (E-Mail/Calendly bereits geteilt). Scoring-Regeln: +30 konkrete Sitz-/Hire-Groessenangabe; +25 explizites Demo-/Termin-/Pilot-Wort; +20 E-Mail oder Firmenname geteilt; +15 Branche + Use-Case; +10 Preisvergleich; +10 Timing-Angabe ("Q3", "diesen Monat", "ASAP"); -10 nur generische Wissensfrage; -20 anonyme reine Support-Frage; -30 explizit "nur Recherche/kein Interesse".',
      },
      intent: {
        type: 'string',
        enum: [
          'research',
          'evaluation',
          'demo_interest',
          'pilot_interest',
          'purchase_ready',
          'support',
          'irrelevant',
        ],
        description:
          'Primaere Absicht des Visitors. "research" = sammelt Infos, "evaluation" = vergleicht Optionen, "demo_interest" = will Demo/Termin, "pilot_interest" = passt zu Pilot-Programm, "purchase_ready" = klar kaufbereit, "support" = Bestandskunden-Frage, "irrelevant" = Spam/Off-Topic.',
      },
      summary: {
        type: 'string',
        description:
          '1-2 Saetze, was der Visitor will. Konkret, ohne Marketing-Sprech. Beispiel: "Tech-Recruiter mit ~40 Mitarbeitern fragt nach Bulk-CV-Verifizierung für Q3-Hiring-Welle. Vergleicht mit HRForecast."',
      },
      language: {
        type: 'string',
        enum: ['de', 'en'],
        description: 'Sprache, in der der Visitor schreibt.',
      },
      company_size_hint: {
        type: 'string',
        description:
          'Falls genannt: ungefaehre Firmen-/Team-Groesse. Beispiele: "10-20 MA", "Mittelstand 250+", "Konzern", "Solo-Recruiter". Leer lassen wenn nicht erkennbar.',
      },
      hires_per_month_hint: {
        type: 'string',
        description:
          'Falls genannt: erwartetes Hire-Volumen pro Monat. Beispiele: "5-10/Monat", "30 in Q3", "1-2 Senior-Hires". Leer lassen wenn nicht erkennbar.',
      },
      industry_hint: {
        type: 'string',
        description:
          'Falls erkennbar: Branche (tech / sales / healthcare / finance / public / staffing / other). Leer lassen wenn unklar.',
      },
      timing_hint: {
        type: 'string',
        description:
          'Falls genannt: Zeitfenster für Entscheidung/Start. Beispiele: "ASAP", "Q3/2026", "in 2-3 Wochen", "noch offen". Leer lassen wenn nicht erkennbar.',
      },
      email_provided: {
        type: 'string',
        description:
          'Falls der Visitor seine E-Mail-Adresse explizit in der Konversation genannt hat. Sonst leer. Validiere grob auf @-Format.',
      },
      key_signals: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Kurz-Liste der konkreten Kauf-/Disqualifikations-Signale aus der Konversation. Max 5 Eintraege, je <= 12 Woerter. Beispiel: ["nennt 40 Sitze", "fragt nach Pilot Q3", "vergleicht mit HRForecast"].',
      },
      recommended_next_action: {
        type: 'string',
        description:
          'Konkrete nächste Sales-Aktion in 1 Satz. Beispiele: "Calendly-Termin direkt nachschicken", "Pilot-One-Pager + Case-Study senden", "Reply mit Bulk-CV-Preisbeispiel", "Kein Follow-up, reine Wissensfrage".',
      },
    },
    required: ['score', 'intent', 'summary', 'language', 'key_signals'],
  },
} as const

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

/**
 * System-Prompt für den Scoring-Sub-Agent (Haiku).
 * Bewusst KURZ — die Aufgabe ist nur Klassifikation, keine Generierung.
 */
export const INTENT_SYSTEM_PROMPT = `Du bist ein Sales-Intent-Klassifikator für die SaaS candiq (DSGVO-konforme Reference-Checks für DACH-Recruiting).

Du bekommst eine Konversation zwischen einem Website-Visitor und dem candiq-AI-Concierge. Deine einzige Aufgabe: rufe das Tool \`capture_lead\` mit einem BANT-Score 0-100 und strukturierten Feldern auf.

Strenge Regeln:
- IMMER das Tool aufrufen — auch bei Score 0.
- Keine Halluzinationen — nur was wirklich in der Konversation steht.
- Score-Inflation vermeiden: hoeflicher Smalltalk != Kauf-Intent.
- Disqualifikatoren erkennen: "nur recherchieren", "für die Uni", "bin Mitbewerber" -> Score <= 10, intent = "irrelevant" oder "research".
- E-Mail nur extrahieren, wenn sie der Visitor selbst genannt hat.
- summary in der Sprache des Visitors.`

/**
 * Heuristische Klammer für Hot-Lead-Schwelle.
 * 60 ist die operative Grenze: ab hier lohnt ein sofortiger Alert an den
 * Founder, weil das BANT-Profil zumindest 2 starke Signale enthaelt.
 */
export const HOT_LEAD_THRESHOLD = 60

/**
 * Empfänger für den internen Hot-Lead-Alert.
 * Per Env override-bar — Default ist der Gruender (siehe Briefing).
 */
export const LEAD_ALERT_RECIPIENT =
  process.env.LEAD_ALERT_EMAIL?.trim() || 'r.serrano@recruiting-sg.de'

// ─────────────────────────────────────────────────────────────────
// E-Mail-Template: Hot-Lead-Alert an den Founder
// ─────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c),
  )
}

function scoreColor(score: number): string {
  if (score >= 80) return '#dc2626'
  if (score >= 60) return '#ea580c'
  if (score >= 40) return '#ca8a04'
  return '#475569'
}

function intentLabel(intent: LeadIntent): string {
  const map: Record<LeadIntent, string> = {
    research: 'Recherche',
    evaluation: 'Evaluierung',
    demo_interest: 'Demo-Interesse',
    pilot_interest: 'Pilot-Interesse',
    purchase_ready: 'Kaufbereit',
    support: 'Support',
    irrelevant: 'Irrelevant',
  }
  return map[intent] ?? intent
}

export type LeadAlertContext = {
  lead: LeadInput
  conversation: ChatMessage[]
  pathname: string | null | undefined
  userAgent?: string | null
  referer?: string | null
  ip?: string | null
}

/**
 * Baut die Founder-Alert-Mail. Klartext + HTML.
 */
export function buildLeadAlertEmail(ctx: LeadAlertContext): {
  subject: string
  html: string
  text: string
} {
  const { lead, conversation, pathname, userAgent, referer } = ctx
  const score = Math.max(0, Math.min(100, Math.round(lead.score)))
  const color = scoreColor(score)
  const heatEmoji = score >= 80 ? '🔥🔥' : score >= 60 ? '🔥' : '•'

  const subject = `${heatEmoji} candiq Hot-Lead (${score}/100) — ${intentLabel(
    lead.intent,
  )}${lead.company_size_hint ? ` · ${lead.company_size_hint}` : ''}`

  const transcript = conversation
    .slice(-12)
    .map(
      (m) =>
        `<div style="margin:8px 0;padding:10px 12px;border-radius:10px;background:${
          m.role === 'user' ? '#eef2ff' : '#f1f5f9'
        };border:1px solid ${m.role === 'user' ? '#c7d2fe' : '#e2e8f0'};">
          <div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">${
            m.role === 'user' ? 'Visitor' : 'Concierge'
          }</div>
          <div style="font-size:13px;color:#0f172a;white-space:pre-wrap;line-height:1.55;">${esc(
            m.content,
          )}</div>
        </div>`,
    )
    .join('')

  const fact = (label: string, value?: string) =>
    value && value.trim()
      ? `<tr><td style="padding:6px 10px;font-size:12px;color:#64748b;width:160px;vertical-align:top;">${label}</td><td style="padding:6px 10px;font-size:13px;color:#0f172a;font-weight:600;">${esc(
          value,
        )}</td></tr>`
      : ''

  const signals = (lead.key_signals ?? [])
    .slice(0, 5)
    .map(
      (s) =>
        `<li style="margin:4px 0;font-size:13px;color:#0f172a;">${esc(s)}</li>`,
    )
    .join('')

  const html = `<!doctype html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
    <div style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
      <div style="padding:20px 24px;background:${color};color:#fff;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;opacity:0.85;font-weight:700;">candiq Concierge — Hot-Lead-Alert</div>
        <div style="font-size:28px;font-weight:900;margin-top:4px;">Score ${score}/100 · ${esc(
          intentLabel(lead.intent),
        )}</div>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#0f172a;"><strong>Summary:</strong> ${esc(
          lead.summary || '—',
        )}</p>

        ${
          lead.recommended_next_action
            ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px 14px;margin:0 0 18px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#9a3412;font-weight:700;margin-bottom:4px;">Recommended Next Action</div>
                <div style="font-size:14px;color:#9a3412;font-weight:600;">${esc(
                  lead.recommended_next_action,
                )}</div>
              </div>`
            : ''
        }

        <table style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:0 0 20px;">
          ${fact('Intent', intentLabel(lead.intent))}
          ${fact('Sprache', lead.language === 'en' ? 'Englisch' : 'Deutsch')}
          ${fact('Company-Size', lead.company_size_hint)}
          ${fact('Hires/Monat', lead.hires_per_month_hint)}
          ${fact('Branche', lead.industry_hint)}
          ${fact('Timing', lead.timing_hint)}
          ${fact('E-Mail (vom Visitor)', lead.email_provided)}
          ${fact('Page', pathname || '/')}
          ${fact('Referer', referer || undefined)}
          ${fact('User-Agent', userAgent ? userAgent.slice(0, 120) : undefined)}
        </table>

        ${
          signals
            ? `<div style="margin:0 0 20px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;font-weight:700;margin-bottom:8px;">Key Signals</div>
                <ul style="margin:0;padding-left:20px;">${signals}</ul>
              </div>`
            : ''
        }

        <div style="margin:24px 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;font-weight:700;">Conversation (letzte ${
          Math.min(conversation.length, 12)
        } Messages)</div>
        <div>${transcript}</div>

        <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;line-height:1.6;">
          Automatisch generiert vom candiq AI-Concierge · Score-Threshold >= ${HOT_LEAD_THRESHOLD} · DSGVO Art. 6 Abs. 1 lit. f (berechtigtes Interesse — Vertragsanbahnung) · Conversation wurde NICHT persistent gespeichert, sondern nur für diesen Alert verarbeitet.
        </p>
      </div>
    </div>
  </div>
</body></html>`

  const textLines = [
    `candiq Hot-Lead-Alert — Score ${score}/100 (${intentLabel(lead.intent)})`,
    '',
    `Summary: ${lead.summary || '—'}`,
    lead.recommended_next_action
      ? `Next Action: ${lead.recommended_next_action}`
      : '',
    '',
    lead.company_size_hint ? `Company-Size: ${lead.company_size_hint}` : '',
    lead.hires_per_month_hint ? `Hires/Monat: ${lead.hires_per_month_hint}` : '',
    lead.industry_hint ? `Branche: ${lead.industry_hint}` : '',
    lead.timing_hint ? `Timing: ${lead.timing_hint}` : '',
    lead.email_provided ? `E-Mail: ${lead.email_provided}` : '',
    pathname ? `Page: ${pathname}` : '',
    '',
    'Key Signals:',
    ...(lead.key_signals ?? []).map((s) => `  - ${s}`),
    '',
    'Conversation:',
    ...conversation
      .slice(-12)
      .map((m) => `[${m.role.toUpperCase()}] ${m.content}`),
  ].filter(Boolean)

  return { subject, html, text: textLines.join('\n') }
}
