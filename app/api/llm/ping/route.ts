import { NextResponse } from 'next/server'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'openai/gpt-4o-mini'

export async function POST() {
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY fehlt in den Umgebungsvariablen.' },
      { status: 500 }
    )
  }

  let res: Response
  let data: any
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'candiq',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a concise assistant.' },
          { role: 'user', content: 'Respond with: OPENROUTER_OK' },
        ],
        max_tokens: 20,
        temperature: 0,
      }),
    })
    data = await res.json()
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'OpenRouter ist derzeit nicht erreichbar (Netzwerkfehler).',
        detail: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 502 }
    )
  }

  if (!res.ok) {
    return NextResponse.json(
      {
        ok: false,
        status: res.status,
        error: data?.error?.message || 'OpenRouter request failed',
      },
      { status: 502 }
    )
  }

  return NextResponse.json({
    ok: true,
    model: data?.model || model,
    reply: data?.choices?.[0]?.message?.content || null,
    provider: data?.provider || null,
  })
}
