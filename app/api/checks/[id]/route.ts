import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'FAILED']
const VALID_RESULTS = ['VERIFIED', 'DISCREPANCY_FOUND', 'UNREACHABLE', 'DECLINED']
const MAX_NOTES_LEN = 5000

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const check = await prisma.referenceCheck.findFirst({
    where: { id: params.id, candidate: { userId: session.user.id } },
  })
  if (!check) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  if (body.status !== undefined) {
    const status = String(body.status)
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Ungültiger Status.' }, { status: 400 })
    }
    data.status = status
  }

  if (body.result !== undefined) {
    const result = body.result === null || body.result === '' ? null : String(body.result)
    if (result !== null && !VALID_RESULTS.includes(result)) {
      return NextResponse.json({ error: 'Ungültiges Ergebnis.' }, { status: 400 })
    }
    data.result = result
  }

  if (body.callNotes !== undefined) {
    const callNotes = body.callNotes === null ? null : String(body.callNotes)
    if (callNotes !== null && callNotes.length > MAX_NOTES_LEN) {
      return NextResponse.json({ error: `Notizen dürfen maximal ${MAX_NOTES_LEN} Zeichen haben.` }, { status: 400 })
    }
    data.callNotes = callNotes
  }

  if (body.discrepancies !== undefined) {
    const discrepancies = body.discrepancies === null ? null : String(body.discrepancies)
    if (discrepancies !== null && discrepancies.length > MAX_NOTES_LEN) {
      return NextResponse.json({ error: `Diskrepanzen dürfen maximal ${MAX_NOTES_LEN} Zeichen haben.` }, { status: 400 })
    }
    data.discrepancies = discrepancies
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

  if (body.calledAt !== undefined) {
    if (body.calledAt === null || body.calledAt === '') {
      data.calledAt = null
    } else {
      const d = new Date(body.calledAt)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Ungültiges Datum.' }, { status: 400 })
      }
      data.calledAt = d
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Keine Änderungen.' }, { status: 400 })
  }

  const updated = await prisma.referenceCheck.update({ where: { id: params.id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const check = await prisma.referenceCheck.findFirst({
    where: { id: params.id, candidate: { userId: session.user.id } },
  })
  if (!check) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  await prisma.referenceCheck.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
