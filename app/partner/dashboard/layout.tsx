import { notFound } from 'next/navigation'
import { requireApprovedPartner } from '@/lib/partner/session'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { PartnerDashboardShell } from '@/components/partner/PartnerDashboardShell'

/**
 * Layout-Shell für /partner/dashboard/**.
 *
 * Strikt getrennt vom HR-Dashboard-Layout (app/(dashboard)/layout.tsx).
 * Eigene Sidebar mit Partner-Domain-Links — keine Reference zu /candidates,
 * /checks, /admin etc.
 *
 * Doppelter Gate:
 *   1. Flag-Gate (PARTNER_PROGRAM_ENABLED=false → 404)
 *   2. requireApprovedPartner() → redirected wenn nicht eingeloggt
 *      oder Status != 'APPROVED'
 *
 * Beide Gates leben im Layout, damit JEDE Sub-Page automatisch geschützt
 * ist — auch eine später vergessene Sub-Route ohne expliziten Guard.
 */
export default async function PartnerDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isPartnerProgramEnabled()) notFound()
  const partner = await requireApprovedPartner()

  return <PartnerDashboardShell partner={partner}>{children}</PartnerDashboardShell>
}
