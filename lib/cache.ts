/**
 * In-memory TTL-Cache für Per-Request-Memoisation.
 * Single-instance Vercel-Functions teilen den Cache zwischen Requests
 * solange die Function-Instanz „warm" ist. Bei Cold-Start ist er leer.
 *
 * Einsatz für teure, idempotente Server-Reads, deren Stale-Tolerance
 * höher ist als die TTL (Search-Suggestions, Plan-Limits, etc.).
 *
 * KEIN Ersatz für Redis bei Multi-Instance-Production. Aber: Free-Tier-
 * Vercel-Functions sind oft single-instance pro Region — und für
 * 200 Requests/Min reicht das locker.
 */

type Entry<T> = { value: T; expiresAt: number }

const MAX_ENTRIES = 1000
const buckets = new Map<string, Entry<unknown>>()

function gc(now: number) {
  if (buckets.size < MAX_ENTRIES) return
  buckets.forEach((entry, key) => {
    if (entry.expiresAt < now) buckets.delete(key)
  })
}

export async function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const hit = buckets.get(key) as Entry<T> | undefined
  if (hit && hit.expiresAt > now) return hit.value

  const value = await fn()
  buckets.set(key, { value, expiresAt: now + ttlMs })
  gc(now)
  return value
}

export function invalidate(prefix: string) {
  const toDelete: string[] = []
  buckets.forEach((_, key) => {
    if (key.startsWith(prefix)) toDelete.push(key)
  })
  toDelete.forEach((key) => buckets.delete(key))
}
