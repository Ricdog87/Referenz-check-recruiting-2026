import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { deleteBlobUrls, deleteBlobsByPrefix } from '@/lib/blob-cleanup'
import { pseudonymizeStaleAuditLogs } from '@/lib/audit-retention'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Cleanup darf länger laufen als der Default — bei groesseren Volumina bis 60 s.
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
 * - AuditLog (Art. 7 DSGVO + § 257 HGB-Nachweispflicht, 3+ Jahre) — wird
 *   aber nach `AUDIT_PII_RETENTION_DAYS` (default 180) PSEUDONYMISIERT
 *   (userId/ip genullt, E-Mails maskiert), G10. Das Ereignis bleibt, der
 *   Personenbezug fällt weg.
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

      // 1b) Retention für Neben-Tabellen (G9): Marketing-/Analyse-Daten,
      //     die nicht am Candidate-Cascade hängen, aber ebenfalls PII tragen.
      //     Gleiche 180-Tage-Frist, Datenminimierung.
      const [leadMagnets, pilots, cvReports] = await Promise.all([
        tx.leadMagnetRequest.deleteMany({ where: { createdAt: { lt: cutoff } } }),
        // Pilot-Bewerbungen: nur in Endzuständen löschen (offene bleiben).
        tx.pilotApplication.deleteMany({
          where: { createdAt: { lt: cutoff }, status: { in: ['REJECTED', 'WITHDRAWN'] } },
        }),
        // CV-Analyse-Reports (CV-abgeleitete Claims) — hart nach Frist.
        tx.cvAnalysisReport.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      ])

      // 2) Alte Candidates in finalem Status finden.
      const candidatesToDelete = await tx.candidate.findMany({
        where: {
          createdAt: { lt: cutoff },
          status: { in: [...FINAL_STATUSES] },
        },
        select: { id: true },
      })
      const candidateIds = candidatesToDelete.map((c) => c.id)

      // 3) Vor dem Cascade-Delete: Blob-Referenzen einsammeln (R2).
      //    Die DB-Cascade entfernt nur Zeilen — die Datei-Objekte im Blob-
      //    Store müssen wir separat NACH dem Commit löschen. Pfade + Check-IDs
      //    daher jetzt sichern, solange die Zeilen noch existieren.
      const [docsToDelete, checksToDelete, tokensViaCascade] =
        candidateIds.length > 0
          ? await Promise.all([
              tx.document.findMany({
                where: { candidateId: { in: candidateIds } },
                select: { path: true },
              }),
              tx.referenceCheck.findMany({
                where: { candidateId: { in: candidateIds } },
                select: { id: true },
              }),
              tx.consentToken.count({ where: { candidateId: { in: candidateIds } } }),
            ])
          : [[], [], 0]

      // 4) Candidate-Delete — onDelete: Cascade zieht Document, ReferenceCheck und ConsentToken mit.
      const deletedCandidates =
        candidateIds.length > 0
          ? await tx.candidate.deleteMany({ where: { id: { in: candidateIds } } })
          : { count: 0 }

      return {
        candidatesDeleted: deletedCandidates.count,
        documentsDeleted: docsToDelete.length,
        checksDeleted: checksToDelete.length,
        tokensExpiredStandalone: expiredTokens.count,
        tokensViaCandidateCascade: tokensViaCascade,
        leadMagnetsDeleted: leadMagnets.count,
        pilotsDeleted: pilots.count,
        cvReportsDeleted: cvReports.count,
        // Für die Post-Commit-Blob-Löschung durchreichen:
        _docPaths: docsToDelete.map((d) => d.path),
        _checkIds: checksToDelete.map((c) => c.id),
      }
    })

    // 4b) Blob-Objekte löschen — NACH erfolgreichem DB-Commit (sonst würden
    //     Dateien gelöscht, während die Transaction noch zurückrollen könnte).
    //     CV-/Zeugnis-Dateien via Document.path, Report-PDFs per Prefix
    //     (reports/<checkId>/ ist nicht DB-getrackt).
    const docBlobs = await deleteBlobUrls(result._docPaths)
    let reportBlobsDeleted = 0
    let reportBlobsFailed = 0
    for (const checkId of result._checkIds) {
      const r = await deleteBlobsByPrefix(`reports/${checkId}/`)
      reportBlobsDeleted += r.deleted
      reportBlobsFailed += r.failed
    }
    const blobsDeleted = docBlobs.deleted + reportBlobsDeleted
    const blobsFailed = docBlobs.failed + reportBlobsFailed
    if (blobsFailed > 0) {
      logger.error('cron_cleanup_blob_partial', { blobsDeleted, blobsFailed })
    }

    // 4c) AuditLog-Pseudonymisierung (G10) — Personenbezug alter Trail-Einträge
    //     entfernen, Ereignis bleibt für die Nachweispflicht erhalten.
    const auditPseudonymized = await pseudonymizeStaleAuditLogs()

    // 5) Audit-Log-Entry — IMMER schreiben, auch bei 0 Löschungen.
    //    Damit ist nachweisbar, dass der Cron-Job gelaufen ist.
    const totalTokens = result.tokensExpiredStandalone + result.tokensViaCandidateCascade
    await prisma.auditLog.create({
      data: {
        action: 'AUTO_CLEANUP_180D',
        entity: 'System',
        entityId: null,
        details: `candidates=${result.candidatesDeleted} tokens=${totalTokens} documents=${result.documentsDeleted} checks=${result.checksDeleted} leadMagnets=${result.leadMagnetsDeleted} pilots=${result.pilotsDeleted} cvReports=${result.cvReportsDeleted} blobsDeleted=${blobsDeleted} blobsFailed=${blobsFailed} auditPseudonymized=${auditPseudonymized.pseudonymized}`,
      },
    })

    // Interne Felder aus der Response entfernen (keine Pfade nach außen).
    const { _docPaths, _checkIds, ...deletedSummary } = result
    logger.info('cron_cleanup_ok', { cutoff: cutoff.toISOString(), ...deletedSummary, blobsDeleted, blobsFailed })

    return NextResponse.json({
      ok: true,
      cutoffDate: cutoff.toISOString(),
      retentionDays: RETENTION_DAYS,
      deleted: { ...deletedSummary, blobsDeleted, blobsFailed },
      auditPseudonymized: auditPseudonymized.pseudonymized,
    })
  } catch (err: any) {
    logger.error('cron_cleanup_error', err)
    return NextResponse.json(
      { error: 'Cleanup failed', message: err?.message ?? 'unknown' },
      { status: 500 },
    )
  }
}

// Vercel Cron uses GET by default; POST wird für manuelles Triggern unterstützt.
export const GET = handleCleanup
export const POST = handleCleanup
