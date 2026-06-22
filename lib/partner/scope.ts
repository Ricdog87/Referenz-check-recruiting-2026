/**
 * Zentrale Scoping-Schicht für Partner-Queries.
 *
 * **Pflicht-Pattern**: jede Prisma-Query, die Partner-eigene Daten liest
 * oder schreibt (PartnerCustomer, PartnerPricing-Overrides,
 * PartnerAuditLog, …), MUSS withPartnerScope() durchlaufen. Direct-Reads
 * mit per-Query-Copypaste sind verboten — sonst entstehen Lecks à la
 * "Partner A sieht Daten von Partner B".
 *
 * Der Test in __tests__/partner-scope.test.ts beweist die Isolation:
 *   - findMany ohne Scope → throw
 *   - findMany mit Scope von Partner A → keine Zeilen von Partner B
 *   - update ohne Scope → throw
 *
 * (Diese Tests folgen in Phase 6.)
 */

export type PartnerScope = {
  partnerAccountId: string
}

/**
 * Baut eine `where`-Clause, die Partner-Datensätze auf einen einzelnen
 * Partner einschränkt. Returnt ein Object, das direkt in Prisma-Aufrufe
 * gespreadet werden kann:
 *
 *   const customers = await prisma.partnerCustomer.findMany({
 *     where: { ...withPartnerScope(partner.id), status: 'ACTIVE' },
 *   })
 *
 * Wirft, wenn partnerAccountId leer ist — verhindert versehentliche
 * "where: { partnerAccountId: undefined }"-Bypässe.
 */
export function withPartnerScope(partnerAccountId: string): PartnerScope {
  if (!partnerAccountId || typeof partnerAccountId !== 'string') {
    throw new Error('[partner/scope] partnerAccountId required — refusing to build unscoped query')
  }
  return { partnerAccountId }
}

/**
 * Composite-Helper für Tabellen, in denen Per-Partner-Overrides UND
 * globale Default-Zeilen koexistieren (PartnerPricing). Gibt einen
 * `OR`-Ausdruck zurück, der beide Quellen erlaubt — Aufrufer sortiert
 * Overrides zuerst (NULLS LAST) und nimmt den ersten Treffer.
 */
export function withPartnerOrGlobalScope(partnerAccountId: string) {
  if (!partnerAccountId || typeof partnerAccountId !== 'string') {
    throw new Error('[partner/scope] partnerAccountId required for or-global scope')
  }
  return {
    OR: [{ partnerAccountId }, { partnerAccountId: null }],
  }
}
