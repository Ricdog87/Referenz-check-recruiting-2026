import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'
import { Header } from '@/components/layout/Header'
import { isZvooveEnabled } from '@/lib/flags'
import { isZvooveDemoMode } from '@/lib/integrations/zvoove/sync'
import { ZvooveConsole } from './ZvooveConsole'

// Immer frisch — spiegelt den Sync-Stand.
export const dynamic = 'force-dynamic'

export default async function ZvooveIntegrationPage() {
  // Flag-Gate: default off → Route existiert faktisch nicht.
  if (!isZvooveEnabled()) notFound()

  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const workspaceId = session.user.id

  const demo = isZvooveDemoMode()

  const [connection, maps] = await Promise.all([
    safeQuery(
      prisma.zvooveConnection.findUnique({
        where: { workspaceId },
        select: { status: true, apiKeyFp: true, baseUrl: true },
      }),
      null as { status: string; apiKeyFp: string; baseUrl: string } | null,
      'zvoove.connection',
    ),
    safeQuery(
      prisma.zvooveCandidateMap.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { zvooveCandidateId: true, candiqCandidateId: true },
      }),
      [] as { zvooveCandidateId: string; candiqCandidateId: string }[],
      'zvoove.maps',
    ),
  ])

  const candidateIds = maps.map((m) => m.candiqCandidateId)
  const candidates =
    candidateIds.length > 0
      ? await safeQuery(
          prisma.candidate.findMany({
            where: { id: { in: candidateIds }, userId: workspaceId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true,
              status: true,
              gdprConsent: true,
              checks: { select: { id: true, employerName: true, status: true, result: true } },
            },
          }),
          [] as any[],
          'zvoove.candidates',
        )
      : []

  const zvooveIdByCandiq = new Map(maps.map((m) => [m.candiqCandidateId, m.zvooveCandidateId]))
  const linked = candidates.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`.trim(),
    position: c.position,
    status: c.status,
    gdprConsent: c.gdprConsent,
    zvooveId: zvooveIdByCandiq.get(c.id) ?? '—',
    checks: c.checks,
  }))

  return (
    <>
      <Header
        title="zvoove-Integration"
        subtitle="Bewerber aus zvoove Recruit importieren, Ergebnisse zurückschreiben"
      />
      <div className="space-y-5">
        <div className="card-md text-xs text-text-secondary leading-relaxed">
          Importierte Bewerber starten <strong className="text-text-primary">ohne Einwilligung</strong>{' '}
          (Status <code>PENDING</code>). Erst nach Bewerber-Einwilligung per Magic-Link werden die
          Prüfungen für Reviewer sichtbar — identisch zum manuellen Anlage-Pfad. Referenzgeber-
          Kontaktdaten nennt der Bewerber selbst, sie kommen nicht aus zvoove.
        </div>
        <ZvooveConsole
          demo={demo}
          connected={connection?.status === 'ACTIVE'}
          candidates={linked}
        />
      </div>
    </>
  )
}
