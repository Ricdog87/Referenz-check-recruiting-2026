import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { rm } from 'fs/promises'
import { join } from 'path'

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  // Delete uploaded files
  const uploadDir = join(process.cwd(), 'public', 'uploads', session.user.id)
  try {
    await rm(uploadDir, { recursive: true, force: true })
  } catch {
    // Directory may not exist
  }

  // Cascade deletes handle all related records via Prisma schema
  await prisma.user.delete({ where: { id: session.user.id } })

  return NextResponse.json({ ok: true })
}
