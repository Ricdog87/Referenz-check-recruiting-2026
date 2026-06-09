import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ZodError } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getClientIp } from '@/lib/rate-limit'
import { analyzeCv, candidateInputSchema } from '@/lib/cv-analysis'

function hashInput(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige JSON-Anfrage.' }, { status: 400 })
  }

  const consentCheck = candidateInputSchema.pick({ consentGiven: true }).safeParse(body)
  if (!consentCheck.success || !consentCheck.data.consentGiven) {
    return NextResponse.json(
      { error: 'Einwilligung erforderlich. Ohne consentGiven=true findet keine CV-Analyse statt.' },
      { status: 403 },
    )
  }

  try {
    const input = candidateInputSchema.parse(body)
    const report = await analyzeCv(input)
    const ip = getClientIp(req)
    const storedReport = await prisma.cvAnalysisReport.create({
      data: {
        userId: session.user.id,
        report,
        inputHash: hashInput(input),
      },
      select: { id: true, createdAt: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CV_ANALYSIS_CREATE',
        entity: 'CvAnalysisReport',
        entityId: storedReport.id,
        details: JSON.stringify({ rag: report.rag, riskScore: report.riskScore, flags: report.flags.length }),
        ip,
      },
    })

    return NextResponse.json({ id: storedReport.id, createdAt: storedReport.createdAt, report }, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Ungültige CV-Analysedaten.', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'CV-Analyse konnte nicht abgeschlossen werden.' }, { status: 500 })
  }
}
