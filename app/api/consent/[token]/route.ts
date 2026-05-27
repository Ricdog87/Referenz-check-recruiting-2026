import { NextRequest, NextResponse } from 'next/server'
import { loadConsentByToken } from '@/lib/consent-token'

/**
 * GET /api/consent/:token
 * Public route — Bewerber lädt sein eigenes Portal-Datenset.
 * Gibt KEINE sensitive Felder zurück, nur was im Portal angezeigt werden darf.
 */
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const record = await loadConsentByToken(decodeURIComponent(params.token))
    return NextResponse.json({
      candidate: {
        firstName: record.candidate.firstName,
        lastName: record.candidate.lastName,
        position: record.candidate.position,
      },
      hiringCompany: record.candidate.user.company || record.candidate.user.name || 'Ihr potenzieller Arbeitgeber',
      status: record.status,
      expiresAt: record.expiresAt.toISOString(),
      acceptedAt: record.acceptedAt?.toISOString() ?? null,
      consentVersion: record.consentVersion,
      scope: JSON.parse(record.scope) as string[],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Token ungültig.' }, { status: 410 })
  }
}
