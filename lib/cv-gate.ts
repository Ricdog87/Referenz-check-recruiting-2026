/**
 * lib/cv-gate.ts
 *
 * Server-seitiger Consent-Gate fuer CV-Inhalte.
 *
 * WICHTIG — Architektur-Realitaet:
 * candiq verbindet sich via Prisma als Postgres-Owner-User mit der DB.
 * Es gibt KEINE Row Level Security (RLS) — Prisma-Queries umgehen RLS
 * grundsaetzlich, weil der verbundene Rolle ROW-LEVEL-SECURITY-BYPASS hat.
 * Eine Supabase-RLS-Policy waere damit Scheinsicherheit.
 *
 * Der Schutz wird stattdessen ausschliesslich auf Application-Layer
 * erzwungen. Diese Datei ist die EINZIGE Entscheidungsstelle. Jede Route,
 * jeder Service, jedes UI-Code-Pfad, der CV-Content ausliefert, MUSS
 * `hasCvAccess()` aufrufen — sonst wird die DSGVO-Pflicht verletzt.
 */

import type { Document } from '@prisma/client'
import { prisma } from '@/lib/db'

export const CV_STATUS = {
  AWAITING: 'AWAITING_CONSENT' as const,
  RELEASED: 'RELEASED' as const,
  REVOKED: 'REVOKED' as const,
}

export type CvStatus = (typeof CV_STATUS)[keyof typeof CV_STATUS]

/**
 * Wer fragt den CV an?
 *  - owner:    HR-User, dem der Kandidat gehoert (eigener Upload)
 *  - reviewer: candiq-internes Personal (REVIEWER / ADMIN)
 *  - public:   anonym
 */
export type CvAccessActor =
  | { kind: 'owner'; userId: string }
  | { kind: 'reviewer' }
  | { kind: 'public' }

export type CvAccessResult = { allowed: true } | { allowed: false; reason: string }

type DocLike = Pick<Document, 'type' | 'cvStatus'> & {
  candidate?: { userId: string } | null
}

/**
 * Single Source of Truth fuer CV-Zugriffsentscheidungen.
 *
 * Logik:
 *  - Non-CV-Dokumente (CERTIFICATE/REFERENCE/OTHER): nicht von diesem
 *    Gate erfasst. Andere Routen muessen ihre eigene Autorisierung halten.
 *  - HR-Owner: darf eigenen Upload immer sehen. Schliesslich hat sie ihn
 *    selbst hochgeladen. Ein Sperren waere kontraproduktiv und kein DSGVO-
 *    Gewinn (die Daten sind bereits beim Kunden eingegangen).
 *  - Reviewer: BRAUCHT cvStatus = RELEASED. Bei AWAITING_CONSENT oder
 *    REVOKED → 403.
 *  - Public: nie.
 */
export function hasCvAccess(doc: DocLike, actor: CvAccessActor): CvAccessResult {
  if (doc.type !== 'CV') return { allowed: true }

  if (actor.kind === 'owner') {
    if (!doc.candidate || doc.candidate.userId !== actor.userId) {
      return { allowed: false, reason: 'not_owner' }
    }
    return { allowed: true }
  }

  if (actor.kind === 'reviewer') {
    if (doc.cvStatus !== CV_STATUS.RELEASED) {
      return { allowed: false, reason: `cv_status_not_released:${doc.cvStatus}` }
    }
    return { allowed: true }
  }

  return { allowed: false, reason: 'unauthenticated' }
}

/**
 * Releaset alle CV-Documents eines Kandidaten. Wird aus dem Consent-Accept
 * heraus aufgerufen, sobald die Einwilligung erteilt ist.
 *
 * Idempotent: setzt nur Documents um, die noch AWAITING_CONSENT sind.
 * Akzeptiert eine optionale Prisma-Transaktions-Instanz.
 */
export async function releaseAllCvsForCandidate(
  candidateId: string,
  tx: typeof prisma | Parameters<Parameters<typeof prisma.$transaction>[0]>[0] = prisma,
): Promise<{ released: number }> {
  const res = await tx.document.updateMany({
    where: {
      candidateId,
      type: 'CV',
      cvStatus: CV_STATUS.AWAITING,
    },
    data: {
      cvStatus: CV_STATUS.RELEASED,
      releasedAt: new Date(),
    },
  })
  return { released: res.count }
}

/**
 * Sperrt alle CV-Documents eines Kandidaten. Wird aus dem Consent-Revoke
 * heraus aufgerufen. Die Files bleiben physisch gespeichert (Audit /
 * 6-Monats-Retention), sind aber fuer Reviewer nicht mehr zugaenglich.
 */
export async function revokeAllCvsForCandidate(
  candidateId: string,
  tx: typeof prisma | Parameters<Parameters<typeof prisma.$transaction>[0]>[0] = prisma,
): Promise<{ revoked: number }> {
  const res = await tx.document.updateMany({
    where: {
      candidateId,
      type: 'CV',
      cvStatus: { not: CV_STATUS.REVOKED },
    },
    data: {
      cvStatus: CV_STATUS.REVOKED,
      revokedAt: new Date(),
    },
  })
  return { revoked: res.count }
}
