/**
 * candiq AI-Concierge — Vercel Edge Function.
 *
 * - Streamt Anthropic Messages API direkt an den Browser
 * - Kein DB-Insert, kein User-Tracking, kein Cookie — DSGVO-friendly
 *   (Wir speichern KEINE Conversation. Sales-Lead-Erfassung passiert
 *   nur opt-in via separates `/api/chat/lead` Endpoint nach 3 Messages.)
 * - Edge-Runtime = niedrigste Latenz weltweit
 * - Rate-Limit pro IP: 30 Messages / 10 Minuten
 */

import { pickSystemPrompt } from '@/lib/chat/system-prompt'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const MODEL = process.env.ANTHROPIC_CHAT_MODEL ?? 'claude-sonnet-4-6'

// Simple in-memory rate-limit. Edge-Functions sharden — das ist OK,
// pro-Shard 30/10min ist ein vernünftiges Soft-Limit gegen Floods.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 10 * 60 * 1000
  const limit = 30
  const entry = rateLimitMap.get(ip)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

type ChatRole = 'user' | 'assistant'
type ChatMessage = { role: ChatRole; content: string }

export async function POST(req: Request) {
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI-Chat ist gerade nicht konfiguriert.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'Zu viele Anfragen. Bitte einen Moment.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let body: { messages?: ChatMessage[]; currentPath?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Ungültige Anfrage.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const messages = Array.isArray(body.messages) ? body.messages : []
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Keine Nachrichten.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Defense: max 20 Messages history, max 4000 chars pro Message
  const sanitized = messages
    .slice(-20)
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content ?? '').slice(0, 4000),
    }))
    .filter((m) => m.content.length > 0)

  if (sanitized.length === 0) {
    return new Response(JSON.stringify({ error: 'Leere Nachrichten.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const systemPrompt = pickSystemPrompt(body.currentPath)
  const pageContext = body.currentPath
    ? `\n\n# Aktueller Page-Kontext\nDer Visitor ist gerade auf: ${body.currentPath}`
    : ''

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      stream: true,
      system: systemPrompt + pageContext,
      messages: sanitized,
    }),
  })

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '')
    console.error('chat_upstream_error', upstream.status, errText.slice(0, 200))
    return new Response(
      JSON.stringify({
        error: 'AI-Chat hat gerade einen Schluckauf. Bitte später erneut.',
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // SSE-Stream von Anthropic in NDJSON von "deltas" wandeln —
  // einfacher für den React-Client zu parsen.
  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = ''
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const data = trimmed.slice(5).trim()
            if (!data || data === '[DONE]') continue
            try {
              const evt = JSON.parse(data)
              if (
                evt.type === 'content_block_delta' &&
                evt.delta?.type === 'text_delta'
              ) {
                const chunk = JSON.stringify({ text: evt.delta.text })
                controller.enqueue(encoder.encode(chunk + '\n'))
              }
            } catch {
              // ignore malformed lines
            }
          }
        }
      } catch (err) {
        console.error('chat_stream_error', err)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
