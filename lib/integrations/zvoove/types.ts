/**
 * lib/integrations/zvoove/types.ts
 *
 * zvoove-Domänentypen — Interface-First.
 *
 * Status: VORLÄUFIG. Die Felder sind aus der allgemeinen ATS-Convention
 * abgeleitet (Personio, SAP SF, Greenhouse). Tatsächliche zvoove-Recruit-
 * Felder werden aus der per-Tenant Swagger-Doku unter
 *   `<tenant>/swagger` (z.B. https://kunde.europersonal.com/swagger)
 * verifiziert.
 *
 * JEDE STELLE, die echte Doku braucht, ist mit `// TODO(zvoove-doc):` markiert.
 * Vor Production-Schalten gegen einen echten Tenant abgleichen.
 */

// ── zvoove-seitige Typen (Wire-Format) ────────────────────────────────────

export type ZvooveCandidateProfile = {
  // TODO(zvoove-doc): exakter ID-Typ (string|number?) per Swagger verifizieren
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  // TODO(zvoove-doc): Field-Name könnte "currentPosition", "targetPosition" o.ä. sein
  position: string | null
  // TODO(zvoove-doc): zvoove-spezifische Status-Enum (z.B. NEW | IN_REVIEW | HIRED | REJECTED)
  status: string
  // TODO(zvoove-doc): Markierung „Referenzcheck angefordert" — exakter Field-Name
  // ist tenant-spezifisch (Custom Field oder Tag), muss bei Onboarding mit
  // Kunde konfiguriert werden. Default-Annahme: `tags: string[]` enthält `'ref-check'`
  tags?: string[]
  /** ISO-8601 */
  createdAt: string
  updatedAt: string
  // TODO(zvoove-doc): Career-History-Struktur — meist `experiences` oder `cvStations`
  experiences?: ZvooveExperience[]
}

export type ZvooveExperience = {
  // TODO(zvoove-doc): Field-Namen aus Swagger verifizieren
  company: string
  jobTitle: string
  /** ISO-Date */
  startDate: string | null
  endDate: string | null
  description?: string | null
}

// Verifikations-Ergebnis, das wir nach Abschluss in zvoove zurückschreiben.
// Format ist tenant-konfigurierbar (Custom Field, Note oder Status-Flag).
export type ZvooveVerificationPayload = {
  candidateId: string
  // VERIFIED | DISCREPANCY_FOUND | UNREACHABLE | DECLINED
  result: string
  // Link auf den candiq-Report (auth-geschützte URL, kein Public-Blob).
  reportUrl: string
  /** ISO-8601 */
  completedAt: string
  // Optional: Diskrepanz-Highlight, geht in zvoove als Note/Comment.
  note?: string
}

// ── Client-Interface (für DI + Tests) ─────────────────────────────────────

export type ZvooveClientConfig = {
  baseUrl: string
  apiKey: string
}

export interface ZvooveClient {
  /**
   * Validiert die Connection — ein Lightweight-GET, der nur prüft, ob
   * Base-URL erreichbar + API-Key akzeptiert ist. Empfohlen für den
   * "Connect"-Flow im UI, bevor der Key persistiert wird.
   *
   * TODO(zvoove-doc): exakter Endpoint (z.B. `/api/v1/me` oder `/health`)
   * aus Swagger entnehmen.
   */
  validateConnection(): Promise<{ ok: true } | { ok: false; status: number; reason: string }>

  /**
   * Listet Bewerberprofile, die für eine Referenzprüfung markiert sind.
   * Markierung erfolgt tenant-seitig (Custom-Field, Tag oder Pipeline-Stage)
   * — siehe Onboarding-Doku im README.
   *
   * TODO(zvoove-doc): exakter Endpoint + Filter-Mechanismus aus Swagger.
   */
  listCandidatesForCheck(opts?: { since?: Date; limit?: number }): Promise<ZvooveCandidateProfile[]>

  /** Einzelnen Bewerber per ID holen (Re-Sync nach Hash-Mismatch). */
  getCandidate(id: string): Promise<ZvooveCandidateProfile | null>

  /**
   * Schreibt Verifikations-Ergebnis nach Abschluss eines candiq-Checks zurück.
   * Wird meist als Note/Comment am Bewerber abgelegt — exaktes Format
   * tenant-konfigurierbar.
   *
   * TODO(zvoove-doc): exakter Endpoint + Payload-Schema.
   */
  pushVerificationResult(payload: ZvooveVerificationPayload): Promise<{ ok: boolean }>
}
