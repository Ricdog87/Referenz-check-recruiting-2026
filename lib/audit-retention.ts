import 'server-only'
import { prisma } from '@/lib/db'
import { redactEmails } from '@/lib/redact'

/**
 * AuditLog-Pseudonymisierung (G10).
 *
 * Spannungsfeld: Der Audit-Trail muss aus rechtlichen Gründen lange
 * aufbewahrt werden (Art. 7 DSGVO-Nachweis, § 257 HGB) — das kollidiert mit
 * der DSGVO-Datenminimierung. Auflösung: Das EREIGNIS (action/entity/Zeit)
 * bleibt erhalten, aber der Personenbezug wird nach einer operativen Frist
 * entfernt — `userId` und `ip` genullt, E-Mails in `details` maskiert.
 *
 * So bleibt „wann geschah was" nachweisbar, ohne identifizierbare
 * Personendaten länger als nötig vorzuhalten.
 *
 * Idempotent: bereits pseudonymisierte Zeilen (userId/ip null, kein '@' in
 * details) matchen den Filter nicht mehr und werden nicht erneut angefasst.
 */

export const AUDIT_PII_RETENTION_DAYS = Number(process.env.AUDIT_PII_RETENTION_DAYS) || 180

// Bounded pro Lauf — der Cron soll nicht unbegrenzt schreiben.
const DEFAULT_BATCH = 500

export type AuditPseudonymizeResult = { scanned: number; pseudonymized: number }

export async function pseudonymizeStaleAuditLogs(opts?: {
  now?: Date
  batchSize?: number
}): Promise<AuditPseudonymizeResult> {
  const now = opts?.now ?? new Date()
  const batchSize = opts?.batchSize ?? DEFAULT_BATCH
  const cutoff = new Date(now.getTime() - AUDIT_PII_RETENTION_DAYS * 24 * 60 * 60 * 1000)

  // Nur Zeilen, die älter als die Frist sind UND noch Personenbezug tragen.
  const rows = await prisma.auditLog.findMany({
    where: {
      createdAt: { lt: cutoff },
      OR: [{ userId: { not: null } }, { ip: { not: null } }, { details: { contains: '@' } }],
    },
    select: { id: true, details: true },
    take: batchSize,
  })

  let pseudonymized = 0
  for (const row of rows) {
    await prisma.auditLog.update({
      where: { id: row.id },
      data: {
        userId: null,
        ip: null,
        details: row.details ? redactEmails(row.details) : row.details,
      },
    })
    pseudonymized++
  }

  return { scanned: rows.length, pseudonymized }
}
