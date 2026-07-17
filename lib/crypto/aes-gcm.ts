/**
 * lib/crypto/aes-gcm.ts
 *
 * AES-256-GCM Verschlüsselung für Tenant-Geheimnisse at-rest.
 * Anwendungsfall: API-Keys von Drittanbietern (z.B. zvoove pro Workspace),
 * die wir in der DB ablegen müssen. Plain-Storage wäre für Multi-Tenant-
 * Setups inakzeptabel — ein DB-Leak gäbe sonst sofort Vollzugriff auf
 * alle Kunden-Tenant-Accounts.
 *
 * Schlüssel-Material aus ENV `INTEGRATION_ENC_KEY` (32 Byte hex, also 64
 * hex-Zeichen). Dieser Schlüssel verschlüsselt Tenant-Secrets — NIE im Code
 * hardcoden, NIE loggen.
 *
 * Format: `<iv_b64>.<authTag_b64>.<ciphertext_b64>` — ein einzeiliger String,
 * direkt DB-tauglich.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGO = 'aes-256-gcm' as const
const IV_LEN = 12 // 96 bit, GCM-Standard
const TAG_LEN = 16 // 128 bit, GCM-Standard

function getKey(): Buffer {
  const hex = process.env.INTEGRATION_ENC_KEY
  if (!hex || hex.length !== 64) {
    throw new Error(
      'INTEGRATION_ENC_KEY fehlt oder hat falsches Format. ' +
        'Erwartet: 64 hex-Zeichen (32 Byte). Generiere mit: ' +
        '`openssl rand -hex 32`',
    )
  }
  return Buffer.from(hex, 'hex')
}

/**
 * Verschlüsselt ein Geheimnis (z.B. einen Tenant-API-Key) für die DB-Ablage.
 * Wirft, wenn `INTEGRATION_ENC_KEY` fehlt — bewusst kein silent-fallback,
 * sonst landen Plain-Secrets in der DB.
 */
export function encryptSecret(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join('.')
}

/**
 * Entschlüsselt einen Wert, der vorher mit `encryptSecret` verschlüsselt
 * wurde. Wirft bei Authentication-Fehler (manipulierter Ciphertext, falscher
 * Key) — defense-in-depth gegen Tampering.
 */
export function decryptSecret(envelope: string): string {
  const key = getKey()
  const parts = envelope.split('.')
  if (parts.length !== 3) {
    throw new Error('decryptSecret: ungültiges Envelope-Format')
  }
  const [ivB64, tagB64, ctB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(tagB64, 'base64')
  const ciphertext = Buffer.from(ctB64, 'base64')
  if (iv.length !== IV_LEN) throw new Error('decryptSecret: IV-Länge falsch')
  if (authTag.length !== TAG_LEN) throw new Error('decryptSecret: Auth-Tag-Länge falsch')
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(authTag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString('utf8')
}

/**
 * Kurz-Fingerprint eines Secrets für Audit-Logs / UI — gibt die ersten und
 * letzten Zeichen wieder, der Mittelteil ist maskiert. Das volle Secret
 * verlässt nie das Server-Memory.
 */
export function fingerprintSecret(plaintext: string): string {
  if (plaintext.length <= 8) return '••••'
  return `${plaintext.slice(0, 4)}…${plaintext.slice(-4)}`
}
