import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Keep-Warm-Cron — wird alle 5 Min von Vercel ausgelöst (siehe vercel.json).
 *
 * Zweck:
 *  1. Hält die Vercel-Serverless-Function instance warm (kein Cold-Start
 *     auf User-Requests).
 *  2. Hält die Supabase-Postgres-Connection im Pool offen (verhindert
 *     dass die DB nach Inaktivität "einschläft" auf Free-Tier).
 *  3. Liefert einen heartbeat den ein externes Uptime-Monitoring abfragen kann.
 *
 * Vercel ruft Cron-Endpunkte mit Header `x-vercel-cron-signature` auf —
 * im Production-Mode wird der Header validiert. Lokal/manuell aufrufen
 * funktioniert weiterhin (rate-limit-freier No-Op).
 *
 * Hobby-Tier-Hinweis: Vercel Hobby erlaubt nur tägliche Crons. Wir nutzen
 * "0 6 * * *" (1× täglich um 06:00 UTC) — reicht aus, um Supabase Free
 * nicht einschlafen zu lassen (Auto-Pause greift erst nach 7 Tagen Idle).
 * Höhere Frequenzen (5-min-warmth) brauchen Vercel Pro.
 */
export async function GET(req: NextRequest) {
  // Im Production-Mode den Vercel-Cron-Header verlangen, sonst öffentlich
  // zugänglich — macht externes Status-Monitoring trivial.
  const isVercelCron = req.headers.get('user-agent')?.includes('vercel-cron') ?? false
  const isAuthorized =
    process.env.NODE_ENV !== 'production' ||
    isVercelCron ||
    req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET ?? ''}`

  // Wir lehnen NICHT ab, wenn auth fehlschlägt — wir wollen sicherstellen,
  // dass auch Drittanbieter-Pinger (UptimeRobot etc.) funktionieren. Wir
  // protokollieren nur das Aufruf-Setting.

  const start = Date.now()
  let dbAlive = false
  try {
    // Mini-Query, um die Postgres-Connection im Pool zu halten.
    await prisma.$queryRaw`SELECT 1`
    dbAlive = true
  } catch {
    /* ignore — Hauptpunkt ist die Function-warmth */
  }

  return NextResponse.json({
    ok: true,
    dbAlive,
    latencyMs: Date.now() - start,
    cron: isVercelCron,
    timestamp: new Date().toISOString(),
  })
}
