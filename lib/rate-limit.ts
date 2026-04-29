/**
 * In-memory rate limiter using sliding-window counter.
 * Suitable for single-instance Vercel deployments.
 * For multi-instance setups, swap for Upstash/Redis.
 */

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 5000

function cleanup(now: number) {
  if (buckets.size < MAX_BUCKETS) return
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt < now) buckets.delete(key)
  })
}

export type RateLimitResult = {
  ok: boolean
  remaining: number
  resetAt: number
  retryAfter: number
}

/**
 * @param key - unique identifier (e.g. `register:${ip}`)
 * @param limit - max requests per window
 * @param windowMs - window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  cleanup(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs, retryAfter: 0 }
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    }
  }

  bucket.count++
  return { ok: true, remaining: limit - bucket.count, resetAt: bucket.resetAt, retryAfter: 0 }
}

export function getClientIp(req: { headers: Headers }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}
