/**
 * Consent-Token-System für Bewerber-Self-Service-Portal.
 *
 * - Token = base64url(`<candidateId>.<nonce>.<expiresAt>.<hmac>`)
 * - HMAC mit NEXTAUTH_SECRET als Schlüssel (kein zusätzliches Secret nötig)
 * - DB speichert NUR den SHA-256-Hash des Tokens (nicht den Token selbst)
 * - Single-use nach acceptedAt
 * - 14 Tage Standard-Gültigkeit
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/db'

const DEFAULT_TTL_DAYS = 14

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET
  if (!s || s.length < 32) {
    throw new Error('NEXTAUTH_SECRET fehlt oder ist zu kurz (min. 32 Zeichen).')
  }
  return s
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): Buffer {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

function sign(payload: string): string {
  return b64url(createHmac('sha256', getSecret()).update(payload).digest())
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export type CreateTokenResult = {
  token: string       // an Bewerber per Mail senden (nur einmal sichtbar!)
  tokenHash: string   // in DB speichern
  expiresAt: Date
}

/**
 * Erzeugt einen signierten Token. Der Token selbst wird NICHT gespeichert,
 * nur sein SHA-256-Hash. Caller muss `tokenHash` in DB persistieren.
 */
export function createConsentToken(candidateId: string, ttlDays = DEFAULT_TTL_DAYS): CreateTokenResult {
  const nonce = b64url(randomBytes(16))
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000)
  const expiresEpoch = Math.floor(expiresAt.getTime() / 1000)
  const payload = `${candidateId}.${nonce}.${expiresEpoch}`
  const sig = sign(payload)
  const token = `${payload}.${sig}`
  return { token, tokenHash: hashToken(token), expiresAt }
}

export type VerifiedToken = {
  candidateId: string
  expiresAt: Date
  tokenHash: string
}

/**
 * Verifiziert Token-Signatur + Expiry. Wirft bei Fehler.
 * Caller muss zusätzlich DB-Status (PENDING_ACCEPT vs REVOKED/EXPIRED) prüfen.
 */
export function verifyConsentToken(token: string): VerifiedToken {
  const parts = token.split('.')
  if (parts.length !== 4) throw new Error('Token-Format ungültig.')
  const [candidateId, nonce, expiresStr, sig] = parts

  if (!candidateId || !nonce || !expiresStr || !sig) {
    throw new Error('Token-Format ungültig.')
  }

  const payload = `${candidateId}.${nonce}.${expiresStr}`
  const expectedSig = sign(payload)
  const sigBuf = b64urlDecode(sig)
  const expectedBuf = b64urlDecode(expectedSig)
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error('Token-Signatur ungültig.')
  }

  const expiresEpoch = parseInt(expiresStr, 10)
  if (!expiresEpoch || isNaN(expiresEpoch)) throw new Error('Token-Ablaufzeit ungültig.')
  const expiresAt = new Date(expiresEpoch * 1000)
  if (expiresAt.getTime() < Date.now()) throw new Error('Token ist abgelaufen.')

  return { candidateId, expiresAt, tokenHash: hashToken(token) }
}

/**
 * High-level lookup: Token-Verifikation + DB-Status + Candidate-Daten.
 * Wirft bei Fehler. Status-Strings sind in Deutsch (für Frontend-Output).
 */
export async function loadConsentByToken(token: string) {
  let v: VerifiedToken
  try {
    v = verifyConsentToken(token)
  } catch (err: any) {
    throw new Error(err?.message ?? 'Token ungültig.')
  }

  const record = await prisma.consentToken.findUnique({
    where: { tokenHash: v.tokenHash },
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          user: { select: { company: true, name: true } },
        },
      },
    },
  })

  if (!record) throw new Error('Token nicht gefunden.')
  if (record.status === 'REVOKED') throw new Error('Diese Einwilligung wurde widerrufen.')
  if (record.status === 'EXPIRED' || record.expiresAt.getTime() < Date.now()) {
    throw new Error('Token ist abgelaufen.')
  }

  return record
}
