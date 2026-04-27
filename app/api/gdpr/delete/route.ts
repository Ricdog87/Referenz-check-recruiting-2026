import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { list, del } from '@vercel/blob'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

    // Delete all blobs for this user from Vercel Blob storage
    const prefix = `candidates/${session.user.id}/`
    try {
      const { blobs } = await list({ prefix })
      if (blobs.length > 0) {
        await del(blobs.map((b) => b.url))
      }
    } catch {
      // Non-fatal: blob deletion failure should not block account deletion
    }

    // Prisma cascade deletes all related records (candidates, checks, documents, gdprConsents, auditLogs)
    await prisma.user.delete({ where: { id: session.user.id } })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Konto konnte nicht gelöscht werden.' }, { status: 500 })
  }
}
