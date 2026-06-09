import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { analyzeCv, candidateInputSchema } from '@/lib/cv-analysis'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/cv-analysis/preview
 *
 * Öffentlicher Preview-Endpoint für die Fabrication-Check-Demo auf der
 * Homepage. Im Gegensatz zu /api/cv-analysis:
 *  - keine Auth
 *  - kein DB-Write (keine Audit-Trail- und CvAnalysisReport-Persistenz)
 *  - kein consentGiven-Pflichtflag (Preview mit Demo-Daten, kein
 *    Realfall — sodass das Widget ohne Klick-Lawine läuft)
 *  - Rate-Limit 10 / Stunde pro IP (verhindert Mass-Scraping unserer
 *    Heuristiken und LLM-Cost-Bombing)
 *  - LLM-Layer läuft optional (lib/cv-analysis/llmClaimAnalysis hat
 *    einen sicheren Fallback ohne API-Key → deterministic + external
 *    reichen für die Demo aus).
 *
 * Die Antwort ist exakt das gleiche RiskReport-Format wie der
 * authentifizierte Endpoint, damit die UI-Komponenten teilbar bleiben.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`cv-preview:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Preview-Limit erreicht. Bitte später erneut versuchen oder Live-Demo im Dashboard buchen.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige JSON-Anfrage.' }, { status: 400 })
  }

  try {
    const input = candidateInputSchema.parse({
      ...(body as Record<string, unknown>),
      // Preview-Modus: setzen wir serverseitig, damit der Demo-Submit
      // nicht über vergessene Checkbox stolpert. Das ist kein realer Auftrag.
      consentGiven: true,
    })
    const report = await analyzeCv(input)
    return NextResponse.json({ report }, { status: 200 })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Eingabe-Schema ungültig.', issues: err.issues },
        { status: 400 },
      )
    }
    console.error('cv-preview_error', err)
    return NextResponse.json(
      { error: 'Preview konnte nicht berechnet werden.' },
      { status: 500 },
    )
  }
}
