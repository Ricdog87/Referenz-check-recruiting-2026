import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Briefcase, Plus, Lock } from 'lucide-react'
import Link from 'next/link'

export default async function ClientsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  // Only agency accounts see this
  if (session.user.accountType !== 'RECRUITMENT_AGENCY') {
    redirect('/dashboard')
  }

  // Mock client data — in v1 these come from Candidate.notes-derived clients
  // Ready for the real schema extension once Multi-Mandanten lands
  const mockClients = [
    { id: '1', name: 'Allianz Tochter (anonym.)', industry: 'Versicherung', activeCandidates: 4, completedChecks: 18, status: 'active' },
    { id: '2', name: 'Tech-Scaleup Berlin', industry: 'SaaS', activeCandidates: 2, completedChecks: 7, status: 'active' },
    { id: '3', name: 'Mittelständischer Maschinenbau', industry: 'Industry', activeCandidates: 0, completedChecks: 22, status: 'paused' },
  ]

  return (
    <>
      <Header
        title="Mandanten"
        subtitle="Übersicht aller Endkunden Ihrer Vermittlung"
        action={
          <button className="btn-primary">
            <Plus className="w-4 h-4" /> Mandant anlegen
          </button>
        }
      />

      <div className="card-md mb-6 bg-gradient-to-br from-brand-50/60 to-violet/5 border-brand-100">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center text-white shadow-card flex-shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary mb-1">Multi-Mandanten-Workflow</div>
            <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
              Verwalten Sie Endkunden mit eigenen Workflows, Branding und Reports. Verfügbar ab Agency Pro.
              Beta — schreibt uns an <a href="mailto:hello@candiq.de" className="text-brand-700 font-semibold">hello@candiq.de</a> für Frühzugang.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {mockClients.map((c) => (
          <div key={c.id} className="card-md flex items-center justify-between gap-4 hover:shadow-card-lg transition-shadow">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-violet/20 border border-brand-200 flex items-center justify-center text-brand-700 font-bold flex-shrink-0">
                {c.name[0]}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-text-primary truncate">{c.name}</span>
                  {c.status === 'paused'
                    ? <span className="badge-warning text-[10px]">Pausiert</span>
                    : <span className="badge-success text-[10px]">Aktiv</span>}
                </div>
                <div className="text-xs text-text-muted">{c.industry}</div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider">Aktive Kandidaten</div>
                <div className="font-bold text-text-primary text-base">{c.activeCandidates}</div>
              </div>
              <div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider">Abgeschlossen</div>
                <div className="font-bold text-text-primary text-base">{c.completedChecks}</div>
              </div>
              <button disabled className="btn-secondary text-xs opacity-60 cursor-not-allowed">
                <Lock className="w-3 h-3" /> Beta
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
