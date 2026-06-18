import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Briefcase, Users, ClipboardList, Mail } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  // Only agency accounts see this
  if (session.user.accountType !== 'RECRUITMENT_AGENCY') {
    redirect('/dashboard')
  }

  // Echte Workspace-Zahlen statt Platzhalter, bis das Mandanten-Schema
  // (eigene Client-Entität) landet. Keine erfundenen Endkunden anzeigen.
  const [candidateCount, completedChecks] = await Promise.all([
    safeQuery(prisma.candidate.count({ where: { userId: session.user.id } }), 0, 'clients.candidateCount'),
    safeQuery(
      prisma.referenceCheck.count({ where: { candidate: { userId: session.user.id }, status: 'COMPLETED' } }),
      0,
      'clients.completedChecks',
    ),
  ])

  return (
    <>
      <Header
        title="Mandanten"
        subtitle="Übersicht aller Endkunden Ihrer Vermittlung"
      />

      <div className="card-md mb-6 bg-gradient-to-br from-amber-50/80 to-white border-amber-200">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary mb-1">
              Multi-Mandanten-Workflow{' '}
              <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold uppercase tracking-wider align-middle">
                Roadmap Q4 2026
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
              Endkunden mit eigenen Workflows, White-Label-Branding und isolierten Reports
              sind in Vorbereitung. Heute laufen alle Kandidaten und Prüfungen im selben
              Workspace — Reports tragen das candiq-Branding.
              <br />
              Fruehzugang oder Mitsprache bei der Spec? Mail an{' '}
              <a href="mailto:hello@candiq.de" className="text-brand-700 font-semibold">
                hello@candiq.de
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Workspace-Gesamtzahlen bis zur Mandanten-Trennung */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card-md flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-text-primary leading-none">{candidateCount}</div>
            <div className="text-xs text-text-muted mt-1">Kandidaten im Workspace</div>
          </div>
        </div>
        <div className="card-md flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-text-primary leading-none">{completedChecks}</div>
            <div className="text-xs text-text-muted mt-1">Abgeschlossene Referenzprüfungen</div>
          </div>
        </div>
      </div>

      {/* Empty state: Mandanten-Entität existiert noch nicht */}
      <div className="card-md text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center mx-auto mb-4 text-text-muted">
          <Briefcase className="w-6 h-6" />
        </div>
        <div className="text-sm font-semibold text-text-primary mb-1">Noch keine Mandanten angelegt</div>
        <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed mb-5">
          Die Mandanten-Trennung (eigene Endkunden mit getrennten Workflows und Reports) ist
          in Vorbereitung. Bis dahin laufen alle Kandidaten und Prüfungen in Ihrem Workspace zusammen.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/candidates/new" className="btn-primary text-xs">
            <Users className="w-3.5 h-3.5" /> Kandidat anlegen
          </Link>
          <a href="mailto:hello@candiq.de?subject=Multi-Mandanten%20Fr%C3%BChzugang" className="btn-secondary text-xs">
            <Mail className="w-3.5 h-3.5" /> Frühzugang anfragen
          </a>
        </div>
      </div>
    </>
  )
}
