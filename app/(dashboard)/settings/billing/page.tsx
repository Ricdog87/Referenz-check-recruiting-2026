import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/Header'
import { BillingPortalButton } from './BillingPortalButton'

export const dynamic = 'force-dynamic'

const PLAN_LABEL: Record<string, string> = {
  NONE: 'Kein Abo',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
}

const STATUS_LABEL: Record<string, { text: string; tone: 'green' | 'amber' | 'red' | 'gray' }> = {
  ACTIVE: { text: 'Aktiv', tone: 'green' },
  TRIALING: { text: 'Testphase', tone: 'green' },
  PAST_DUE: { text: 'Zahlung überfällig', tone: 'amber' },
  INCOMPLETE: { text: 'Unvollständig', tone: 'amber' },
  CANCELLED: { text: 'Gekündigt', tone: 'red' },
  INACTIVE: { text: 'Inaktiv', tone: 'gray' },
}

const INTERVAL_LABEL: Record<string, string> = {
  MONTHLY: 'Monatlich',
  YEARLY: 'Jährlich',
}

const TONE_CLASS: Record<'green' | 'amber' | 'red' | 'gray', string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  gray: 'bg-bg-secondary text-text-secondary border-border',
}

export default async function BillingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      planStatus: true,
      billingInterval: true,
      currentPeriodEnd: true,
      stripeCustomerId: true,
    },
  })
  if (!user) redirect('/login')

  const status = STATUS_LABEL[user.planStatus] ?? STATUS_LABEL.INACTIVE
  const isActive = user.planStatus === 'ACTIVE' || user.planStatus === 'TRIALING' || user.planStatus === 'PAST_DUE'
  const formattedEnd = user.currentPeriodEnd
    ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(user.currentPeriodEnd)
    : null

  return (
    <>
      <Header title="Abrechnung" subtitle="Plan & Zahlungsdetails" />
      <div className="max-w-2xl space-y-5">
        <div className="card-lg shadow-card-md">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-text-muted font-semibold">Aktueller Plan</div>
                <div className="text-2xl font-bold text-text-primary mt-1">
                  {isActive ? (PLAN_LABEL[user.plan] ?? user.plan) : 'Kein aktives Abo'}
                </div>
              </div>
              {isActive && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${TONE_CLASS[status.tone]}`}
                >
                  {status.text}
                </span>
              )}
            </div>

            {isActive && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <dt className="text-xs text-text-muted">Abrechnungs-Intervall</dt>
                  <dd className="text-sm font-medium text-text-primary mt-0.5">
                    {INTERVAL_LABEL[user.billingInterval ?? 'MONTHLY'] ?? user.billingInterval}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Nächste Abrechnung</dt>
                  <dd className="text-sm font-medium text-text-primary mt-0.5">
                    {formattedEnd ?? '—'}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>

        {user.stripeCustomerId && isActive ? (
          <div className="card-md">
            <h2 className="font-semibold text-text-primary mb-1">Abo verwalten</h2>
            <p className="text-sm text-text-secondary mb-4">
              Zahlungsmethode aktualisieren, Rechnungen einsehen oder Abo kündigen — über das Stripe Customer Portal.
            </p>
            <BillingPortalButton />
          </div>
        ) : (
          <div className="card-md">
            <h2 className="font-semibold text-text-primary mb-1">Noch kein aktives Abo</h2>
            <p className="text-sm text-text-secondary mb-4">
              Du hast noch kein aktives Abo. Wähle einen Plan, um candiq produktiv zu nutzen.
            </p>
            <Link href="/preise" className="btn-primary inline-flex items-center gap-2">
              Pläne ansehen
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
