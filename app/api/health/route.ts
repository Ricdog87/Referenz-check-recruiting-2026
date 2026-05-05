import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Diagnose-Endpoint.
 *
 * Default ist öffentlich erreichbar (Vercel/Status-Monitor brauchen das).
 * Falls `HEALTH_SECRET` env var gesetzt ist, wird `?secret=…` verlangt —
 * dann werden auch sensible env-Felder offengelegt (DB host, etc).
 *
 * Ohne Secret: minimaler Output (alive ja/nein) — kein Leak von Stack/Hosts.
 * Mit Secret-Match: voller Diagnose-Dump.
 */
export async function GET(req: NextRequest) {
  const start = Date.now()
  const required = process.env.HEALTH_SECRET
  const provided = req.nextUrl.searchParams.get('secret')
  const isAuthenticated = !required || (!!provided && provided === required)

  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
  }

  const dbInfo = parseDbUrl(process.env.DATABASE_URL)

  if (!process.env.DATABASE_URL) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { status: 'unhealthy', alive: false, timestamp: new Date().toISOString() },
        { status: 503 },
      )
    }
    return NextResponse.json(
      {
        status: 'unhealthy',
        env,
        db: { configured: false },
        hint: 'DATABASE_URL ist nicht gesetzt. In Vercel → Settings → Environment Variables ergänzen und Redeploy auslösen.',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }

  let dbAlive = false
  let dbError: string | null = null
  let dbErrorCode: string | null = null
  const tables: Record<string, boolean> = {}

  try {
    await prisma.$queryRaw`SELECT 1`
    dbAlive = true
  } catch (err: any) {
    dbError = String(err?.message ?? err).slice(0, 240)
    dbErrorCode = err?.code ?? err?.errorCode ?? null
  }

  if (dbAlive) {
    const expected = ['User', 'Candidate', 'ReferenceCheck', 'Document', 'AuditLog', 'AddonOrder', 'PasswordResetToken', 'GdprConsent']
    for (const tbl of expected) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "${tbl}" LIMIT 1`)
        tables[tbl] = true
      } catch {
        tables[tbl] = false
      }
    }
  }

  const latencyMs = Date.now() - start
  const allTablesPresent = Object.values(tables).every(Boolean)
  const status = !dbAlive ? 'unhealthy' : !allTablesPresent ? 'degraded' : 'ok'

  let hint: string | null = null
  if (!dbAlive) {
    if (dbErrorCode === 'P1001') hint = 'DB-Host nicht erreichbar — prüfe ob Supabase-Projekt aktiv ist (Free Tier pausiert nach Inaktivität) und ob Hostname/Port stimmen.'
    else if (dbErrorCode === 'P1002') hint = 'DB-Verbindungs-Timeout — meist temporär. Wenn dauerhaft: Connection-Limits prüfen.'
    else if (dbErrorCode === 'P1003') hint = 'Datenbank existiert nicht — Datenbankname in DATABASE_URL prüfen.'
    else if (dbError?.includes('password authentication failed')) hint = 'Passwort falsch — DATABASE_URL aus Supabase neu kopieren.'
    else if (dbError?.includes('prepared statement')) hint = 'Pgbouncer + prepared statements: Setze ?pgbouncer=true&connection_limit=1 in der DATABASE_URL.'
    else if (dbError?.includes('does not exist') && dbInfo?.host?.includes('supabase')) hint = 'Supabase-Pool-User braucht das Format postgres.PROJECT_REF — neu aus Supabase kopieren.'
    else if (dbError) hint = `DB-Fehler: ${dbErrorCode ?? 'unbekannt'}. Details siehe „db.error".`
  } else if (!allTablesPresent) {
    const missing = Object.entries(tables).filter(([, v]) => !v).map(([k]) => k)
    hint = `Diese Tabellen fehlen: ${missing.join(', ')}. POST auf /api/admin/init?secret=… (mit INIT_SECRET) löst den Schema-Sync aus, oder lokal "npx prisma db push" gegen die selbe DB ausführen.`
  }

  // Wenn HEALTH_SECRET gesetzt und nicht authentifiziert → minimaler Output.
  // Status-Monitoring funktioniert weiterhin, aber kein Leak von Hosts/Tabellen.
  if (!isAuthenticated) {
    return NextResponse.json(
      { status, alive: dbAlive, latencyMs, timestamp: new Date().toISOString() },
      { status: status === 'unhealthy' ? 503 : 200 },
    )
  }

  return NextResponse.json(
    {
      status,
      env,
      db: {
        configured: true,
        alive: dbAlive,
        host: dbInfo?.host ?? null,
        port: dbInfo?.port ?? null,
        database: dbInfo?.database ?? null,
        pooled: dbInfo?.pooled ?? false,
        pgbouncerFlag: dbInfo?.pgbouncerFlag ?? false,
        error: dbError,
        errorCode: dbErrorCode,
      },
      tables,
      hint,
      latencyMs,
      timestamp: new Date().toISOString(),
    },
    { status: status === 'unhealthy' ? 503 : 200 },
  )
}

function parseDbUrl(raw: string | undefined) {
  if (!raw) return null
  try {
    const u = new URL(raw)
    return {
      host: u.hostname,
      port: u.port || (u.protocol === 'postgres:' ? '5432' : null),
      database: u.pathname.replace(/^\//, '') || null,
      pooled: /pooler\.supabase\.com$/i.test(u.hostname) || u.port === '6543',
      pgbouncerFlag: u.searchParams.get('pgbouncer') === 'true',
    }
  } catch {
    return { host: 'unparseable', port: null, database: null, pooled: false, pgbouncerFlag: false }
  }
}
