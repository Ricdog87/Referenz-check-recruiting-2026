/**
 * lib/integrations/zvoove/consent-guard.ts
 *
 * KRITISCH: Diese Datei ist die nicht-verhandelbare Schranke zwischen der
 * zvoove-Integration und dem CV-Consent-Gate (lib/cv-gate.ts).
 *
 * REGEL: Ein über zvoove importierter Kandidat MUSS denselben Consent-Pfad
 * durchlaufen wie ein manuell angelegter. Die zvoove-Anbindung darf den
 * Gate NICHT umgehen — auch nicht, wenn zvoove den Kandidaten "pusht".
 *
 * Was das konkret heißt:
 *  1. Candidate wird mit `gdprConsent: false` und `status: PENDING` angelegt.
 *  2. Documents (falls je importiert) starten mit `cvStatus: AWAITING_CONSENT`.
 *  3. Bevor irgendein Reviewer den Kandidaten/CV sehen darf, muss der
 *     Bewerber per Magic-Link einwilligen (lib/consent-token.ts).
 *  4. ReferenceChecks werden in `status: OPEN` angelegt und KEIN auto-
 *     Übergang zu IN_REVIEW — der Übergang erfordert weiterhin explizite
 *     HR-Aktion (PATCH /api/checks/:id) ODER explizite Sammeluebergabe,
 *     die ihrerseits `candidate.gdprConsent === true` voraussetzt.
 *
 * Hier sind die Constraints typisiert, sodass jeder, der den zvoove-Import-
 * Path anfasst, gegen diese Werte programmiert — und Tests dagegen schreibt.
 */

/**
 * Initialwerte für einen zvoove-importierten Kandidaten. NICHT überschreiben
 * — wer einen Kandidaten anders importiert, umgeht den Consent-Gate.
 */
export const ZVOOVE_IMPORT_DEFAULTS = {
  candidate: {
    /** DSGVO-Einwilligung kommt vom Bewerber per Magic-Link, NIE aus zvoove. */
    gdprConsent: false as const,
    gdprConsentDate: null,
    gdprConsentIp: null,
    /** PENDING bedeutet: noch keine Einwilligung, kein Reviewer-Zugriff. */
    status: 'PENDING' as const,
  },
  document: {
    /** type='CV' triggert das CV-Consent-Gate aus lib/cv-gate.ts */
    cvStatus: 'AWAITING_CONSENT' as const,
  },
  referenceCheck: {
    /** OPEN = Draft, noch keine Reviewer-Sichtbarkeit. */
    status: 'OPEN' as const,
  },
} as const

/**
 * Prüft VOR dem Anlegen, dass die Werte konform sind. Wirft ausdrücklich,
 * statt silent zu korrigieren — Caller soll merken, dass sein Code falsch ist.
 */
export function assertConsentSafeCandidateInput(input: {
  gdprConsent?: boolean
  status?: string
}): void {
  if (input.gdprConsent === true) {
    throw new Error(
      'zvoove-Import-Guard: gdprConsent=true ist NICHT erlaubt. ' +
        'Einwilligung muss vom Bewerber per Magic-Link erteilt werden.',
    )
  }
  if (input.status && input.status !== 'PENDING') {
    throw new Error(
      `zvoove-Import-Guard: status="${input.status}" ist NICHT erlaubt. ` +
        'Importierte Kandidaten starten in PENDING — kein Bypass.',
    )
  }
}

/**
 * Prüft, dass ein importierter Check NICHT direkt im Reviewer-Bereich landet.
 * Reviewer dürfen Checks erst sehen, wenn HR sie nach Bewerber-Consent explizit
 * übergibt (lib/check-notifications.ts).
 */
export function assertConsentSafeCheckStatus(status: string): void {
  if (status !== 'OPEN') {
    throw new Error(
      `zvoove-Import-Guard: Check-Status="${status}" ist beim Import NICHT erlaubt. ` +
        'Nur OPEN. Reviewer-Übergabe (IN_REVIEW) verlangt vorherigen Bewerber-Consent.',
    )
  }
}
