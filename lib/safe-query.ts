/**
 * Per-query Fehler-Catch fuer Server-Components mit Promise.all().
 *
 * Hintergrund: Wenn EINE Prisma-Query in einem Promise.all() throwt
 * (Driver-Hick-Up, nicht migrierte Spalte, leere Relation, Timeout),
 * killt das den gesamten Page-Render und der User landet auf error.tsx.
 * Mit `safeQuery` bekommt jede Query einen typsicheren Fallback, das
 * Dashboard rendert weiter und das Issue wird geloggt.
 *
 * Andre Sola, Juni 2026: Prospect-Crash nach Login auf /dashboard war
 * der Anlass; siehe PR #109 und Follow-up #110.
 */
export function safeQuery<T>(p: Promise<T>, fallback: T, label: string): Promise<T> {
  return p.catch((err) => {
    // Bewusst console.error (kein logger), damit Vercel-Runtime-Logs
    // den Stack mit einklemmen — leichter zu greppen.
    console.error(`[safe-query:fail] ${label}`, err?.message ?? err)
    return fallback
  })
}
