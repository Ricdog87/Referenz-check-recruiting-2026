import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const HOST = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://candiq.de').replace(/\/$/, '')
const HOSTNAME = HOST.replace(/^https?:\/\//, '')
const KEY = process.env.NEXT_PUBLIC_INDEXNOW_KEY
const MAX_URLS = 100

/**
 * GET /api/internal/indexnow-ping
 *
 * Per Vercel-Cron getriggert: liest die aktuelle sitemap.xml, extrahiert die
 * URLs und meldet sie an IndexNow (Bing, Yandex, Naver via api.indexnow.org),
 * statt auf den nächsten Crawl zu warten.
 *
 * Schutz: Vercel-Cron schickt automatisch `Authorization: Bearer $CRON_SECRET`,
 * wenn CRON_SECRET in den Project-Env-Vars gesetzt ist (gleiches Muster wie
 * /api/cron/cleanup). Manuelle Aufrufe ohne korrektes Bearer -> 401.
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }
  if (!KEY) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_INDEXNOW_KEY nicht gesetzt.' }, { status: 503 })
  }

  // 1) Sitemap lesen + URLs extrahieren
  let urls: string[] = []
  try {
    const res = await fetch(`${HOST}/sitemap.xml`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`sitemap HTTP ${res.status}`)
    const xml = await res.text()
    urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1].trim())
  } catch (e: any) {
    return NextResponse.json({ error: `Sitemap nicht lesbar: ${e?.message ?? 'unknown'}` }, { status: 502 })
  }

  urls = Array.from(new Set(urls)).slice(0, MAX_URLS)
  if (urls.length === 0) {
    return NextResponse.json({ ok: true, pinged: 0, note: 'keine URLs in sitemap.xml' })
  }

  // 2) IndexNow-Ping (ein Endpoint genuegt; verteilt an alle teilnehmenden Engines)
  const payload = {
    host: HOSTNAME,
    key: KEY,
    keyLocation: `${HOST}/${KEY}.txt`,
    urlList: urls,
  }

  let ping: Response
  try {
    ping = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })
  } catch (e: any) {
    return NextResponse.json({ error: `IndexNow nicht erreichbar: ${e?.message ?? 'unknown'}` }, { status: 502 })
  }

  return NextResponse.json({ ok: ping.ok, indexnowStatus: ping.status, pinged: urls.length })
}

