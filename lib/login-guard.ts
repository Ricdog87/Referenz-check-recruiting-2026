import { rateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * Brute-Force-/Credential-Stuffing-Bremse für die Login-`authorize()`-
 * Callbacks (HR + Partner). Nutzt bewusst denselben In-Memory-Limiter
 * wie der Rest der Codebase — der durable-Backend-Swap (Upstash/Redis,
 * G3-Backlog) härtet dann ALLE Rate-Limits einheitlich, statt das Login
 * mit einem Sonderweg zu divergieren.
 *
 * Doppelter Schlüssel: pro IP (breite Angriffe) UND pro Account-E-Mail
 * (gezieltes Stuffing einer Adresse über viele IPs bremst wenigstens die
 * warme Instanz). authorize() gibt bei Blockade `null` zurück — kein
 * Oracle, ununterscheidbar von falschem Passwort.
 */

// NextAuth v4 reicht in authorize() ein req-artiges Objekt; Header können
// eine Headers-Instanz ODER ein Plain-Object sein — beides tolerieren.
function ipFromAuthorizeReq(req: unknown): string {
  const anyReq = req as { headers?: unknown } | undefined
  const h = anyReq?.headers
  if (h && typeof (h as Headers).get === 'function') {
    return getClientIp({ headers: h as Headers })
  }
  if (h && typeof h === 'object') {
    const rec = h as Record<string, string | string[] | undefined>
    const pick = (k: string) => {
      const v = rec[k]
      return Array.isArray(v) ? v[0] : v
    }
    const fwd = pick('x-vercel-forwarded-for') ?? pick('x-forwarded-for')
    if (fwd) return fwd.split(',')[0].trim()
    return (pick('x-real-ip') as string) ?? 'unknown'
  }
  return 'unknown'
}

/**
 * @returns true, wenn der Login-Versuch fortgesetzt werden darf; false, wenn
 *          das Rate-Limit greift (authorize soll dann null zurückgeben).
 */
export function loginAttemptAllowed(scope: 'hr' | 'partner', email: string, req: unknown): boolean {
  const ip = ipFromAuthorizeReq(req)
  const normEmail = email.trim().toLowerCase().slice(0, 254)
  // 10 Versuche / 15 min je (scope,ip) und je (scope,email).
  const WINDOW = 15 * 60 * 1000
  const byIp = rateLimit(`login:${scope}:ip:${ip}`, 10, WINDOW)
  const byEmail = rateLimit(`login:${scope}:email:${normEmail}`, 10, WINDOW)
  return byIp.ok && byEmail.ok
}
