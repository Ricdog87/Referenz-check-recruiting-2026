/**
 * lib/integrations/zvoove/mapper.ts
 *
 * Reine Mapping-Funktionen zwischen zvoove-Domäne und candiq-Domäne.
 * KEINE Seiteneffekte, KEINE DB-Calls — testbar in Isolation.
 *
 * TODO(zvoove-doc): Feldnamen müssen gegen die per-tenant Swagger-Doku
 * verifiziert werden. Hier dokumentierte Annahmen sind aus allgemeiner
 * ATS-Convention abgeleitet.
 */

import { createHash } from 'crypto'
import type { ZvooveCandidateProfile } from './types'

/**
 * candiq-seitiges Kandidaten-Format (Subset von Prisma.Candidate-Input).
 */
export type CandiqCandidateImport = {
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  position: string
  // Status startet IMMER auf PENDING — Consent-Gate wird im Service-Layer
  // erzwungen, nicht hier. Der Mapper schreibt nichts ohne Konsent-Flow.
  status: 'PENDING'
  notes: string | null
}

/**
 * Wandelt ein zvoove-Profil in unser candiq-Schema. Kein DB-Zugriff,
 * keine Logik außer Field-Mapping + Sanitization.
 */
export function mapZvooveToCandiq(p: ZvooveCandidateProfile): CandiqCandidateImport {
  // TODO(zvoove-doc): Edge-Case wenn firstName/lastName als "fullName" kommt
  return {
    firstName: clean(p.firstName, 120) || 'Unbekannt',
    lastName: clean(p.lastName, 120) || 'Unbekannt',
    email: nullableEmail(p.email),
    phone: clean(p.phone ?? '', 40) || null,
    position: clean(p.position ?? '', 200) || 'Unbekannte Position',
    status: 'PENDING',
    notes: buildImportNote(p),
  }
}

/**
 * Stabiler Hash über die für candiq RELEVANTEN zvoove-Felder. Wird in
 * ZvooveCandidateMap.externalHash gespeichert — wir re-syncen nur, wenn
 * sich der Hash ändert. Idempotenz garantiert.
 *
 * Achtung: KEINE Timestamps mit aufnehmen (createdAt/updatedAt), sonst
 * würde jeder Sync ein Update triggern.
 */
export function hashZvooveProfile(p: ZvooveCandidateProfile): string {
  const stable = {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email ?? null,
    phone: p.phone ?? null,
    position: p.position ?? null,
    status: p.status,
    experiences: (p.experiences ?? []).map((e) => ({
      company: e.company,
      jobTitle: e.jobTitle,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
  }
  return createHash('sha256').update(JSON.stringify(stable)).digest('hex')
}

/**
 * Zvoove-Career-History → candiq ReferenceCheck-Drafts. Liefert nur die
 * Werte; das Erzeugen der DB-Records macht der Service-Layer.
 *
 * Bewusst KEINE employerEmail/employerPhone — Referenzgeber-Kontaktdaten
 * werden vom BEWERBER im Consent-Portal selbst genannt (DSGVO Art. 6 Abs. 1
 * lit. a). Wir importieren aus zvoove nur die *Stationen*, nicht die
 * Kontaktdaten der Vorgesetzten.
 */
export function mapZvooveExperiencesToCheckDrafts(
  p: ZvooveCandidateProfile,
): Array<{
  employerName: string
  position: string | null
  startDate: string | null
  endDate: string | null
}> {
  return (p.experiences ?? [])
    .filter((e) => e.company && e.jobTitle)
    .map((e) => ({
      employerName: clean(e.company, 200),
      position: clean(e.jobTitle, 200) || null,
      startDate: e.startDate ?? null,
      endDate: e.endDate ?? null,
    }))
}

// ── Helpers ──────────────────────────────────────────────────────────────

function clean(s: string, max: number): string {
  return String(s ?? '').trim().slice(0, max)
}

function nullableEmail(s: string | null): string | null {
  if (!s) return null
  const t = s.trim().toLowerCase()
  // Sehr leichte Validierung — strengere Prüfung beim DB-Insert via Prisma
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return null
  return t.slice(0, 254)
}

function buildImportNote(p: ZvooveCandidateProfile): string {
  const parts = [`Importiert aus zvoove Recruit (ID: ${p.id})`]
  if (p.tags && p.tags.length > 0) parts.push(`Tags: ${p.tags.join(', ')}`)
  parts.push(`Letzte zvoove-Aktualisierung: ${p.updatedAt}`)
  return parts.join(' · ')
}
