import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { requireApprovedPartner } from '@/lib/partner/session'
import { PartnerCoBrandUploader } from '@/components/partner/PartnerCoBrandUploader'
import { ShieldCheck, Image as ImageIcon, Info } from 'lucide-react'

export const metadata: Metadata = pageMeta({
  title: 'Partner — Co-Branding',
  description: 'Logo-Upload und Vorschau des Co-Brand-Reports.',
  path: '/partner/dashboard/co-brand',
  noindex: true,
})

export const dynamic = 'force-dynamic'

export default async function PartnerCoBrandPage() {
  const partner = await requireApprovedPartner()

  const account = await prisma.partnerAccount.findUnique({
    where: { id: partner.id },
    select: { logoUrl: true, company: true },
  })

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary tracking-tightest">Co-Branding</h1>
        <p className="text-sm text-text-secondary mt-1">
          Logo-Upload für Reports und Endkunden-Kommunikation. Das candiq-Siegel
          bleibt sichtbarer Pflichtbestandteil.
        </p>
      </header>

      {/* Pflicht-Reminder ─────────────────────────────────────────── */}
      <div className="mb-6 flex gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
        <ShieldCheck className="w-5 h-5 text-indigo-700 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-indigo-900 leading-relaxed">
          <div className="font-semibold mb-1">candiq-Siegel ist pflicht-mountet.</div>
          {'„'}verifiziert durch candiq{'"'} erscheint sichtbar im Footer aller Reports
          und kann nicht entfernt werden. Ihr Logo wird im Header zusätzlich
          eingebunden — Ihre Marke prominent, das Siegel als Vertrauens-Anker.
        </div>
      </div>

      {/* Upload ────────────────────────────────────────────────────── */}
      <section className="card-md mb-6">
        <h2 className="text-base font-bold text-text-primary mb-1 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> Ihr Logo
        </h2>
        <p className="text-xs text-text-secondary mb-4">
          PNG, JPG, SVG oder WEBP — max. 2 MB. Empfohlen: transparenter
          Hintergrund, mindestens 400×120 px für scharfe Darstellung im Report.
        </p>
        <PartnerCoBrandUploader
          initialLogoUrl={account?.logoUrl ?? null}
          companyName={account?.company ?? partner.name}
        />
      </section>

      {/* Hinweis zu Anwendung ─────────────────────────────────────── */}
      <div className="flex gap-3 p-4 bg-surface-subtle border border-border-default rounded-xl">
        <Info className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
        <div className="text-xs text-text-secondary leading-relaxed">
          Das Logo erscheint nach dem Upload auf:
          <ul className="list-disc list-inside mt-2 space-y-0.5">
            <li>PDF-Reports an Endkunden Ihrer Mandanten (Header)</li>
            <li>Welcome-Mails, die candiq an neue End-Mandanten verschickt</li>
            <li>Branding-Slot im Endkunden-Dashboard (Roadmap)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
