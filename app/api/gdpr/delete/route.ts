import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { rm } from 'fs/promises'
import { join } from 'path'

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const userId = session.user.id

  // Delete uploaded files (best-effort; missing dir is fine, other errors are logged)
  const uploadDir = join(process.cwd(), 'public', 'uploads', userId)
  try {
    await rm(uploadDir, { recursive: true, force: true })
  } catch (err) {
    logger.warn('gdpr_delete_uploads_warn', { userId, err: err instanceof Error ? err.message : String(err) })
  }

  // Cascade deletes handle all related records via Prisma schema
  try {
    await prisma.user.delete({ where: { id: userId } })
  } catch (err) {
    logger.error('gdpr_delete_user_error', { userId, err: err instanceof Error ? err.message : String(err) })
    return NextResponse.json(
      { error: 'Löschung fehlgeschlagen. Bitte erneut versuchen oder hello@candiq.de kontaktieren.' },
      { status: 503 },
    )
  }

  return NextResponse.json({ ok: true })
}
