import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { requireApprovedPartner } from '@/lib/partner/session'
import { PartnerSettingsForm } from '@/components/partner/PartnerSettingsForm'
import { Mail, Info } from 'lucide-react'

export const metadata: Metadata = pageMeta({
  title: 'Partner — Einstellungen',
  description: 'Firmendaten und Passwort Ihres Partner-Accounts verwalten.',
  path: '/partner/dashboard/settings',
  noindex: true,
})

export const dynamic = 'force-dynamic'

export default async function PartnerSettingsPage() {
  const partner = await requireApprovedPartner()

  const account = await prisma.partnerAccount.findUnique({
    where: { id: partner.id },
    select: {
      email: true,
      company: true,
      contactFirstName: true,
      contactLastName: true,
      phone: true,
    },
  })

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary tracking-tightest">Einstellungen</h1>
        <p className="text-sm text-text-secondary mt-1">
          Firmendaten und Zugangsdaten Ihres Partner-Accounts.
        </p>
      </header>

      <PartnerSettingsForm
        initial={{
          company: account?.company ?? '',
          contactFirstName: account?.contactFirstName ?? '',
          contactLastName: account?.contactLastName ?? '',
          phone: account?.phone ?? '',
        }}
        email={account?.email ?? partner.email}
      />

      <div className="mt-6 flex gap-3 p-4 bg-surface-subtle border border-border-default rounded-xl">
        <Info className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
        <div className="text-xs text-text-secondary leading-relaxed">
          <strong>E-Mail-Adresse ändern:</strong> Ihre Login-E-Mail ist zugleich
          die Identität für Einladungs-Bindungen und kann daher nicht im
          Self-Service geändert werden. Schreiben Sie an{' '}
          <a href="mailto:partner@candiq.de" className="underline hover:text-indigo-600 inline-flex items-center gap-1">
            <Mail className="w-3 h-3" /> partner@candiq.de
          </a>{' '}
          — wir ändern sie nach Verifikation.
        </div>
      </div>
    </div>
  )
}
