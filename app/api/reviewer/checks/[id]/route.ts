import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isReviewer } from '@/lib/reviewer'
import { getClientIp } from '@/lib/rate-limit'

const VALID_RESULTS = ['VERIFIED', 'DISCREPANCY_FOUND', 'UNREACHABLE', 'DECLINED']
const MAX_NOTES_LEN = 5000

/**
 * PATCH /api/reviewer/checks/:id
 * Reviewer speichert Gesprächsnotizen, Diskrepanzen, Rating, Ergebnis.
 * Rollen-gated (REVIEWER/ADMIN), BEWUSST ohne userId-Filter — Reviewer
 * arbeiten workspace-übergreifend. Status wird hier NICHT verändert
 * (Freigabe läuft über /release).
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (!isReviewer(session)) return NextResponse.json({ error: 'Reviewer-Rolle erforderlich.' }, { status: 403 })

  const check = await prisma.referenceCheck.findUnique({ where: { id: params.id } })
  if (!check) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })
  if (check.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Prüfung ist bereits freigegeben.' }, { status: 409 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  if (body.callNotes !== undefined) {
    const v = body.callNotes === null ? null : String(body.callNotes)
    if (v !== null && v.length > MAX_NOTES_LEN) {
      return NextResponse.json({ error: `Notizen max. ${MAX_NOTES_LEN} Zeichen.` }, { status: 400 })
    }
    data.callNotes = v
  }

  if (body.discrepancies !== undefined) {
    const v = body.discrepancies === null ? null : String(body.discrepancies)
    if (v !== null && v.length > MAX_NOTES_LEN) {
      return NextResponse.json({ error: `Diskrepanzen max. ${MAX_NOTES_LEN} Zeichen.` }, { status: 400 })
    }
    data.discrepancies = v
  }

  if (body.rating !== undefined) {
    if (body.rating === null) {
      data.rating = null
    } else {
      const rating = Number(body.rating)
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Bewertung muss zwischen 1 und 5 liegen.' }, { status: 400 })
      }
      data.rating = rating
    }
  }

  if (body.result !== undefined) {
    const result = body.result === null || body.result === '' ? null : String(body.result)
    if (result !== null && !VALID_RESULTS.includes(result)) {
      return NextResponse.json({ error: 'Ungültiges Ergebnis.' }, { status: 400 })
    }
    data.result = result
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Keine Änderungen.' }, { status: 400 })
  }

  const updated = await prisma.referenceCheck.update({ where: { id: params.id }, data })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'REVIEW_UPDATE',
      entity: 'ReferenceCheck',
      entityId: check.id,
      details: JSON.stringify({ fields: Object.keys(data) }),
      ip: getClientIp(req),
    },
  })

  return NextResponse.json(updated)
}

