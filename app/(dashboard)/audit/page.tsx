import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
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
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.auditLog.count({ where: { userId: session.user.id } }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where: { userId: session.user.id },
      _count: true,
    }),
    prisma.auditLog.groupBy({
      by: ['entity'],
      where: { userId: session.user.id },
      _count: true,
    }),
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
          createdAt: l.createdAt.toISOString(),
        }))}
        actions={actions.map((a) => ({ value: a.action, count: a._count }))}
        entities={entities.map((e) => ({ value: e.entity, count: e._count }))}
        active={{ action: searchParams.action ?? '', entity: searchParams.entity ?? '' }}
      />
    </>
  )
}
