/**
 * Runtime environment validation.
 * Imported by server entry points (auth, db, API routes) so that missing
 * required vars surface as a clear error instead of silent runtime failures.
 *
 * Build-time imports (sitemap, robots, layout metadata) tolerate missing
 * vars via fallbacks — only the runtime path enforces.
 */

type EnvKey = 'DATABASE_URL' | 'NEXTAUTH_SECRET' | 'NEXTAUTH_URL'

const REQUIRED_AT_RUNTIME: EnvKey[] = ['DATABASE_URL', 'NEXTAUTH_SECRET']

const isBuildPhase =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NEXT_PHASE === 'phase-export'

function validate() {
  if (isBuildPhase) return

  const missing = REQUIRED_AT_RUNTIME.filter((k) => !process.env[k] || process.env[k]?.trim() === '')

  if (missing.length > 0) {
    const msg = `[env] Missing required environment variables: ${missing.join(', ')}`
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg)
    } else {
      console.warn(msg)
    }
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (secret && secret.length < 32 && process.env.NODE_ENV === 'production') {
    throw new Error('[env] NEXTAUTH_SECRET must be at least 32 characters in production')
  }
}

let validated = false
export function ensureEnv() {
  if (validated) return
  validated = true
  validate()
}

ensureEnv()

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? '',
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://candiq.de',
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
  EMAIL_FROM: process.env.EMAIL_FROM ?? 'candiq <hello@candiq.de>',
  EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO ?? 'hello@candiq.de',
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ?? '',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
}
