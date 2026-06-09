import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Cleanup darf laenger laufen als der Default — bei groesseren Volumina bis 60 s.
export const maxDuration = 60

/**
 * Tägliche DSGVO-Auto-Löschung nach 180 Tagen.
 *
 * Versprechen auf candiq.de: „Daten werden spätestens nach 6 Monaten
 * automatisch gelöscht." → diese Aussage wird hier durchgesetzt.
 *
 * Was wird gelöscht
 * - ConsentToken mit expiresAt < now - 180d → hard delete (orphans)
 * - Candidate mit createdAt < now - 180d UND status ∈ {COMPLETED,
 *   REJECTED, CONSENT_REVOKED} → cascade-delete zieht Documents,
 *   ReferenceChecks und ConsentTokens dieses Bewerbers mit.
 *
 * Was NICHT gelöscht wird
 * - AuditLog (Art. 7 DSGVO + § 257 HGB-Nachweispflicht, 3+ Jahre)
 * - Buchhaltungsrelevante User-/AddonOrder-Daten (§ 147 AO, 10 Jahre)
 * - Candidates in PENDING/IN_REVIEW/CONSENT_GIVEN (laufender Prozess)
 *
 * Auth: Bearer-Token gegen CRON_SECRET (in Vercel-Project-Env setzen).
 * Schreibt IMMER einen AuditLog-Entry mit action="AUTO_CLEANUP_180D" —
 * auch bei 0 Löschungen, als Beweis, dass der Cron lief.
 */

const RETENTION_DAYS = 180
const FINAL_STATUSES = ['COMPLETED', 'REJECTED', 'CONSENT_REVOKED'] as const

function unauthorized() {
  return new NextResponse(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'WWW-Authenticate': 'Bearer realm="cron"',
    },
  })
}

async function handleCleanup(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    logger.error('cron_cleanup_no_secret_configured')
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured on the server' },
      { status: 500 },
    )
  }

  // Vercel Cron sendet `Authorization: Bearer <CRON_SECRET>` automatisch,
  // wenn die env-var im Vercel-Project hinterlegt ist.
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token || token !== cronSecret) {
    return unauthorized()
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1) Abgelaufene Consent-Tokens (auch wenn der Candidate noch lebt) — Hard-Delete.
      const expiredTokens = await tx.consentToken.deleteMany({
        where: { expiresAt: { lt: cutoff } },
      })

      // 2) Alte Candidates in finalem Status finden.
      const candidatesToDelete = await tx.candidate.findMany({
        where: {
          createdAt: { lt: cutoff },
          status: { in: [...FINAL_STATUSES] },
        },
        select: { id: true },
      })
      const candidateIds = candidatesToDelete.map((c) => c.id)

      // 3) Vor dem Delete: Anzahl der mitgerissenen Records zaehlen (fuer Audit-Trail).
      const [documentsAffected, checksAffected, tokensViaCascade] =
        candidateIds.length > 0
          ? await Promise.all([
              tx.document.count({ where: { candidateId: { in: candidateIds } } }),
              tx.referenceCheck.count({ where: { candidateId: { in: candidateIds } } }),
              tx.consentToken.count({ where: { candidateId: { in: candidateIds } } }),
            ])
          : [0, 0, 0]

      // 4) Candidate-Delete — onDelete: Cascade zieht Document, ReferenceCheck und ConsentToken mit.
      const deletedCandidates =
        candidateIds.length > 0
          ? await tx.candidate.deleteMany({ where: { id: { in: candidateIds } } })
          : { count: 0 }

      return {
        candidatesDeleted: deletedCandidates.count,
        documentsDeleted: documentsAffected,
        checksDeleted: checksAffected,
        tokensExpiredStandalone: expiredTokens.count,
        tokensViaCandidateCascade: tokensViaCascade,
      }
    })

    // 5) Audit-Log-Entry — IMMER schreiben, auch bei 0 Loeschungen.
    //    Damit ist nachweisbar, dass der Cron-Job gelaufen ist.
    const totalTokens = result.tokensExpiredStandalone + result.tokensViaCandidateCascade
    await prisma.auditLog.create({
      data: {
        action: 'AUTO_CLEANUP_180D',
        entity: 'System',
        entityId: null,
        details: `candidates=${result.candidatesDeleted} tokens=${totalTokens} documents=${result.documentsDeleted} checks=${result.checksDeleted}`,
      },
    })

    logger.info('cron_cleanup_ok', { cutoff: cutoff.toISOString(), ...result })

    return NextResponse.json({
      ok: true,
      cutoffDate: cutoff.toISOString(),
      retentionDays: RETENTION_DAYS,
      deleted: result,
    })
  } catch (err: any) {
    logger.error('cron_cleanup_error', err)
    return NextResponse.json(
      { error: 'Cleanup failed', message: err?.message ?? 'unknown' },
      { status: 500 },
    )
  }
}

// Vercel Cron uses GET by default; POST wird fuer manuelles Triggern unterstuetzt.
export const GET = handleCleanup
export const POST = handleCleanup
