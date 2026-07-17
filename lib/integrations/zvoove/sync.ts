import 'server-only'
import { prisma } from '@/lib/db'
import { isFlagEnabled } from '@/lib/flags'
import { decryptSecret } from '@/lib/crypto/aes-gcm'
import { logger } from '@/lib/logger'
import { redactEmails } from '@/lib/redact'
import { MockZvooveClient, FIXTURE_CANDIDATE_BASIC, FIXTURE_CANDIDATE_MINIMAL } from './__mocks__/MockZvooveClient'
import { HttpZvooveClient } from './client'
import { mapZvooveToCandiq, mapZvooveExperiencesToCheckDrafts, hashZvooveProfile } from './mapper'
import { assertConsentSafeCandidateInput, assertConsentSafeCheckStatus, ZVOOVE_IMPORT_DEFAULTS } from './consent-guard'
import type { ZvooveClient } from './types'

/**
 * zvoove-Sync-Orchestrierung (Phase 2).
 *
 * Verbindet die reinen zvoove-Module (Client/Mapper/Consent-Guard) mit der
 * candiq-DB. KRITISCH: jeder Import läuft durch den Consent-Guard — importierte
 * Kandidaten starten zwingend `gdprConsent=false`, `status=PENDING`, Checks
 * `OPEN`. Kein Bypass, identisch zum manuellen Anlage-Pfad.
 *
 * Demo-Modus (`INTEGRATION_ZVOOVE_DEMO=true`): die Gegenstelle ist der
 * In-Memory-`MockZvooveClient` mit 2 Fixtures — der VOLLSTÄNDIGE candiq-Flow
 * (Import → Consent → Check → Rückschreiben) läuft in der UI, ohne echten
 * zvoove-Tenant. Für Sales-Demos vor Sandbox-Verfügbarkeit.
 */

export function isZvooveDemoMode(): boolean {
  return isFlagEnabled('INTEGRATION_ZVOOVE_DEMO')
}

// Loses DB-Interface — erlaubt Dependency-Injection im Test.
type Db = {
  zvooveConnection: { findUnique: (a: any) => Promise<any> }
  zvooveCandidateMap: { findUnique: (a: any) => Promise<any>; create: (a: any) => Promise<any> }
  zvooveSyncLog: { create: (a: any) => Promise<any> }
  candidate: { create: (a: any) => Promise<any> }
  referenceCheck: { create: (a: any) => Promise<any>; findFirst: (a: any) => Promise<any> }
}

/**
 * Liefert den zvoove-Client für einen Workspace. Demo-Modus → Mock mit
 * Fixtures; sonst die gespeicherte, entschlüsselte Connection. `null`, wenn
 * (im Nicht-Demo-Modus) keine Verbindung existiert.
 */
export async function getZvooveClientForWorkspace(
  workspaceId: string,
  db: Db = prisma as unknown as Db,
): Promise<ZvooveClient | null> {
  if (isZvooveDemoMode()) {
    return new MockZvooveClient([FIXTURE_CANDIDATE_BASIC, FIXTURE_CANDIDATE_MINIMAL])
  }
  const conn = await db.zvooveConnection.findUnique({ where: { workspaceId } })
  if (!conn) return null
  const apiKey = decryptSecret(conn.apiKeyEnc)
  return new HttpZvooveClient({ baseUrl: conn.baseUrl, apiKey })
}

export type ImportResult = {
  imported: number
  skipped: number
  failed: number
  candidateIds: string[]
}

/**
 * Importiert die zur Prüfung markierten Bewerber eines Workspaces. Idempotent
 * über `ZvooveCandidateMap.externalHash` (SHA-256): unveränderte Profile
 * werden übersprungen, kein Doppel-Import.
 */
export async function importZvooveCandidates(opts: {
  workspaceId: string
  client: ZvooveClient
  db?: Db
}): Promise<ImportResult> {
  const db = opts.db ?? (prisma as unknown as Db)
  const { workspaceId } = opts
  const profiles = await opts.client.listCandidatesForCheck({ limit: 50 })

  let imported = 0
  let skipped = 0
  let failed = 0
  const candidateIds: string[] = []

  for (const p of profiles) {
    try {
      const hash = hashZvooveProfile(p)
      const existing = await db.zvooveCandidateMap.findUnique({
        where: { workspaceId_zvooveCandidateId: { workspaceId, zvooveCandidateId: p.id } },
      })
      if (existing) {
        // Bereits importiert. (Phase 3: Re-Sync bei Hash-Mismatch. Hier bewusst
        // idempotent-skip, um bestehende candiq-Daten nie zu überschreiben.)
        skipped++
        continue
      }

      const mapped = mapZvooveToCandiq(p)
      // Consent-Guard: defense-in-depth VOR dem Insert.
      assertConsentSafeCandidateInput({
        gdprConsent: ZVOOVE_IMPORT_DEFAULTS.candidate.gdprConsent,
        status: ZVOOVE_IMPORT_DEFAULTS.candidate.status,
      })

      const candidate = await db.candidate.create({
        data: {
          firstName: mapped.firstName,
          lastName: mapped.lastName,
          email: mapped.email,
          phone: mapped.phone,
          position: mapped.position,
          notes: mapped.notes,
          // Consent kommt vom Bewerber per Magic-Link — NIE aus zvoove.
          gdprConsent: ZVOOVE_IMPORT_DEFAULTS.candidate.gdprConsent,
          gdprConsentDate: null,
          gdprConsentIp: null,
          status: ZVOOVE_IMPORT_DEFAULTS.candidate.status,
          userId: workspaceId,
        },
      })

      for (const d of mapZvooveExperiencesToCheckDrafts(p)) {
        assertConsentSafeCheckStatus(ZVOOVE_IMPORT_DEFAULTS.referenceCheck.status)
        await db.referenceCheck.create({
          data: {
            candidateId: candidate.id,
            employerName: d.employerName,
            position: d.position,
            startDate: d.startDate,
            endDate: d.endDate,
            // OPEN = Draft, keine Reviewer-Sichtbarkeit bis HR nach Consent übergibt.
            status: ZVOOVE_IMPORT_DEFAULTS.referenceCheck.status,
          },
        })
      }

      await db.zvooveCandidateMap.create({
        data: {
          workspaceId,
          zvooveCandidateId: p.id,
          candiqCandidateId: candidate.id,
          externalHash: hash,
          syncState: 'SYNCED',
          lastSyncedAt: new Date(),
        },
      })
      await db.zvooveSyncLog.create({
        data: {
          workspaceId,
          action: 'import_candidate',
          status: 'OK',
          candidateId: candidate.id,
          details: `zvooveId=${p.id}`,
        },
      })
      imported++
      candidateIds.push(candidate.id)
    } catch (err) {
      failed++
      logger.error('zvoove_import_failed', {
        workspaceId,
        zvooveId: p.id,
        message: err instanceof Error ? redactEmails(err.message) : String(err),
      })
      await db.zvooveSyncLog
        .create({ data: { workspaceId, action: 'import_candidate', status: 'FAILED', details: `zvooveId=${p.id}` } })
        .catch(() => {})
    }
  }

  return { imported, skipped, failed, candidateIds }
}

export type PushResult = { ok: boolean; reason?: string }

/**
 * Schreibt das Ergebnis eines abgeschlossenen Checks nach zvoove zurück.
 * Nur für Checks, die (a) dem Workspace gehören, (b) COMPLETED sind und
 * (c) einen zvoove-Ursprung haben.
 */
export async function pushZvooveResult(opts: {
  workspaceId: string
  checkId: string
  client: ZvooveClient
  baseUrl: string
  db?: Db
}): Promise<PushResult> {
  const db = opts.db ?? (prisma as unknown as Db)
  const { workspaceId, checkId } = opts

  const check = await db.referenceCheck.findFirst({
    where: { id: checkId, candidate: { userId: workspaceId } },
    include: { candidate: true },
  })
  if (!check) return { ok: false, reason: 'not_found' }
  if (check.status !== 'COMPLETED') return { ok: false, reason: 'not_completed' }

  const map = await db.zvooveCandidateMap.findUnique({
    where: { candiqCandidateId: check.candidateId },
  })
  if (!map) return { ok: false, reason: 'no_zvoove_link' }

  await opts.client.pushVerificationResult({
    candidateId: map.zvooveCandidateId,
    result: check.result ?? 'UNREACHABLE',
    // Auth-geschützter Report-Link, KEIN Public-Blob.
    reportUrl: `${opts.baseUrl}/report/check/${check.id}`,
    completedAt: (check.updatedAt instanceof Date ? check.updatedAt : new Date()).toISOString(),
    note: check.discrepancies ?? undefined,
  })

  await db.zvooveSyncLog.create({
    data: {
      workspaceId,
      action: 'push_result',
      status: 'OK',
      candidateId: check.candidateId,
      checkId: check.id,
      details: `result=${check.result ?? 'UNREACHABLE'}`,
    },
  })
  return { ok: true }
}
