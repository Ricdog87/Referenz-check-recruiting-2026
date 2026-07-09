import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
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
 *
 * Account-Linking (Doppelrolle): existiert ein HR-User-Konto mit derselben
 * E-Mail, zeigt die Shell einen "Zum HR-Dashboard"-Link. Reine Navigation —
 * die Cookie-/Session-Trennung beider Welten bleibt unangetastet; ohne
 * gültige HR-Session landet man dort auf /login.
 */
export default async function PartnerDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isPartnerProgramEnabled()) notFound()
  const partner = await requireApprovedPartner()

  const hrAccount = partner.email
    ? await prisma.user
        .findFirst({
          where: { email: { equals: partner.email, mode: 'insensitive' } },
          select: { id: true },
        })
        .catch(() => null)
    : null

  return (
    <PartnerDashboardShell partner={partner} hasHrAccount={Boolean(hrAccount)}>
      {children}
    </PartnerDashboardShell>
  )
}
