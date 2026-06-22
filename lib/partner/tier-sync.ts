/**
 * Tier-Sync-Logik für das Partner-Programm.
 *
 * Für jeden Partner: zählt aktive Mandanten (PartnerCustomer.status='ACTIVE')
 * und vergleicht mit dem aktuell gespeicherten PartnerAccount.tier.
 * Bei Abweichung wird das Tier aktualisiert + ein PartnerAuditLog-Eintrag
 * geschrieben.
 *
 * Wird vom Cron unter /api/cron/partner-tier-sync aufgerufen (monatlich,
 * Vercel-Cron-Pattern). Lässt sich aber auch manuell anstoßen.
 *
 * KEIN Downgrade-Schutz: wenn ein Partner Kunden verloren hat, sinkt
 * sein Tier. Das ist gewollt — Bestands-EK-Konditionen werden über
 * PartnerCustomer.ekPriceCents (Snapshot) eingefroren, nicht über das Tier.
 */

import 'server-only'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { currentTierFromCount, allTiers } from '@/lib/partner/tier'

export type TierSyncResult = {
  partnersChecked: number
  partnersUpdated: number
  changes: Array<{
    partnerAccountId: string
    company: string
    activeCount: number
    oldTier: string
    newTier: string
  }>
}

export async function syncAllPartnerTiers(): Promise<TierSyncResult> {
  const tiers = await allTiers()
  if (tiers.length === 0) {
    logger.warn('partner_tier_sync_no_tiers')
    return { partnersChecked: 0, partnersUpdated: 0, changes: [] }
  }

  const partners = await prisma.partnerAccount.findMany({
    where: { deletedAt: null, status: 'APPROVED' },
    select: { id: true, company: true, tier: true },
  })

  const changes: TierSyncResult['changes'] = []

  for (const p of partners) {
    const activeCount = await prisma.partnerCustomer.count({
      where: { partnerAccountId: p.id, status: 'ACTIVE' },
    })
    const computed = currentTierFromCount(tiers, activeCount)
    if (!computed || computed.tier === p.tier) continue

    try {
      await prisma.$transaction([
        prisma.partnerAccount.update({
          where: { id: p.id },
          data: { tier: computed.tier },
        }),
        prisma.partnerAuditLog.create({
          data: {
            partnerAccountId: p.id,
            action: 'PARTNER_TIER_SYNC',
            entity: 'PartnerAccount',
            entityId: p.id,
            details: `active=${activeCount} ${p.tier}→${computed.tier}`,
          },
        }),
      ])

      changes.push({
        partnerAccountId: p.id,
        company: p.company,
        activeCount,
        oldTier: p.tier,
        newTier: computed.tier,
      })
    } catch (err) {
      logger.error('partner_tier_sync_partner_error', { partnerAccountId: p.id, err })
    }
  }

  return {
    partnersChecked: partners.length,
    partnersUpdated: changes.length,
    changes,
  }
}
