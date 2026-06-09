import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadConsentByToken } from '@/lib/consent-token'
import { prisma } from '@/lib/db'
import { ConsentPortalClient } from './ConsentPortalClient'

export const metadata: Metadata = {
  title: 'Einwilligung zur Referenzprüfung – candiq',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function CandidatePortalPage({ params }: { params: { token: string } }) {
  let record
  try {
    record = await loadConsentByToken(decodeURIComponent(params.token))
  } catch (err: any) {
    return (
      <main id="main" className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Link nicht mehr gültig</h1>
          <p className="text-slate-600 text-sm mb-6">
            {err?.message ?? 'Dieser Einwilligungs-Link ist nicht mehr gültig. Bitte kontaktieren Sie den Personalverantwortlichen.'}
          </p>
          <a href="https://candiq.de" className="text-indigo-600 text-sm font-semibold hover:underline">
            Zu candiq.de
          </a>
        </div>
      </main>
    )
  }

  const documents = await prisma.document.findMany({
    where: { candidateId: record.candidateId },
    select: { id: true, originalName: true, size: true, type: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const initialData = {
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
    documents: documents.map(d => ({
      id: d.id,
      originalName: d.originalName,
      size: d.size,
      type: d.type,
      createdAt: d.createdAt.toISOString(),
    })),
  }

  return <ConsentPortalClient token={params.token} initialData={initialData} />
}
