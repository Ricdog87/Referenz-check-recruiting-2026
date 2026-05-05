import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Normalisiert die DATABASE_URL für Supabase + pgbouncer.
 *
 * Häufiger Vercel-Stolperstein: Nutzer kopiert die Supabase „Pooled Connection"
 * (Port 6543) ohne den `?pgbouncer=true` Anhang. Prisma hält dann prepared
 * statements offen, die pgbouncer im Transaction-Mode sofort verwirft →
 * cryptische `prepared statement does not exist`.
 *
 * Wichtig für Performance: connection_limit MUSS auf einem Wert > 1 stehen,
 * sonst werden alle parallelen Queries (z. B. Dashboard mit 5 × Promise.all)
 * über genau eine Connection serialisiert — was einen 5×-Slowdown verursacht.
 * pgbouncer im Transaction-Mode multiplext mehrere Client-Connections auf
 * wenige DB-Connections, daher ist 5 hier ein sinnvolles Default. User kann
 * via `?connection_limit=N` in der URL überschreiben.
 */
const DEFAULT_PGBOUNCER_CONN_LIMIT = '5'

function normalizeDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw
  try {
    const url = new URL(raw)
    const isSupabasePooler = /pooler\.supabase\.com$/i.test(url.hostname)
    const isPgbouncerPort = url.port === '6543'

    if (isSupabasePooler || isPgbouncerPort) {
      if (!url.searchParams.has('pgbouncer')) url.searchParams.set('pgbouncer', 'true')
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', DEFAULT_PGBOUNCER_CONN_LIMIT)
      }
    }
    return url.toString()
  } catch {
    // Wenn die URL unparsbar ist, geben wir sie unverändert zurück und lassen
    // Prisma seinen normalen Fehler werfen.
    return raw
  }
}

const datasourceUrl = normalizeDatabaseUrl(process.env.DATABASE_URL)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    ...(datasourceUrl ? { datasourceUrl } : {}),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
