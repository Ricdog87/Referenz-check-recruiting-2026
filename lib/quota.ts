import 'server-only'
import { prisma } from '@/lib/db'
import { getPlanById } from '@/lib/utils'

/**
 * Monats-Kontingent für Referenzprüfungen (G24 — Umsatz-Integrität).
 *
 * Die abrechenbare Einheit ist die ReferenceCheck. `Plan.includedChecks`
 * definiert das monatliche Kontingent je Tarif; bisher wurde es NIRGENDS
 * durchgesetzt — Nutzer konnten unbegrenzt Checks anlegen (Umsatz-Leck).
 *
 * Kandidaten sind bewusst NICHT gemetert (man zahlt pro Prüfung, nicht pro
 * Kandidat) — daher kein Guard in /api/candidates.
 *
 * ENTERPRISE (includedChecks=0, Custom-Volumen) = unbegrenzt.
 */

export type QuotaResult = {
  allowed: boolean
  used: number
  limit: number
  unlimited: boolean
}

function startOfCurrentMonth(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export async function getCheckQuota(userId: string, plan: string): Promise<QuotaResult> {
  const planMeta = getPlanById(plan)
  // ENTERPRISE / Custom-Volumen: includedChecks=0 bedeutet „individuell",
  // nicht „null erlaubt" → unbegrenzt.
  const unlimited = plan === 'ENTERPRISE' || planMeta.includedChecks === 0
  const limit = planMeta.includedChecks

  const used = await prisma.referenceCheck.count({
    where: {
      candidate: { userId },
      createdAt: { gte: startOfCurrentMonth() },
    },
  })

  return {
    allowed: unlimited || used < limit,
    used,
    limit,
    unlimited,
  }
}
