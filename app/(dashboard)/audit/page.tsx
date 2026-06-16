import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'
import { Header } from '@/components/layout/Header'
import { AuditTrailClient } from './AuditTrailClient'

export const dynamic = 'force-dynamic'

export default async function AuditPage({
  searchParams,
}: {
  searchParams: { action?: string; entity?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const where = {
    userId: session.user.id,
    ...(searchParams.action ? { action: searchParams.action } : {}),
    ...(searchParams.entity ? { entity: searchParams.entity } : {}),
  }

  const [logs, total, actions, entities] = await Promise.all([
    safeQuery(
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      [] as Awaited<ReturnType<typeof prisma.auditLog.findMany>>,
      'audit.logs',
    ),
    safeQuery(prisma.auditLog.count({ where: { userId: session.user.id } }), 0, 'audit.total'),
    safeQuery(
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { userId: session.user.id },
        _count: true,
      }),
      [] as { action: string; _count: number }[],
      'audit.actions',
    ),
    safeQuery(
      prisma.auditLog.groupBy({
        by: ['entity'],
        where: { userId: session.user.id },
        _count: true,
      }),
      [] as { entity: string; _count: number }[],
      'audit.entities',
    ),
  ])

  return (
    <>
      <Header
        title="Audit-Trail"
        subtitle={`${total} protokollierte Ereignisse · DSGVO Art. 30 konform`}
      />
      <AuditTrailClient
        logs={logs.map((l) => ({
          id: l.id,
          action: l.action,
          entity: l.entity,
          entityId: l.entityId,
          details: l.details,
          ip: l.ip,
          // createdAt ist im Schema non-null, aber defensiv (Driver-Edge-Cases).
          createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : new Date().toISOString(),
        }))}
        actions={actions.map((a) => ({ value: a.action, count: a._count }))}
        entities={entities.map((e) => ({ value: e.entity, count: e._count }))}
        active={{ action: searchParams.action ?? '', entity: searchParams.entity ?? '' }}
      />
    </>
  )
}
