import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { readFileSync } from 'fs'
import path from 'path'
import Link from 'next/link'
import { ArrowLeft, Clock, FileText, Mail } from 'lucide-react'
import { LEAD_MAGNETS, getLeadMagnet } from '@/content/resources/data'
import { BOOKING_URL } from '@/lib/site'
import { LeadMagnetGate } from './LeadMagnetGate'

export function generateStaticParams() {
  return LEAD_MAGNETS.map((m) => ({ slug: m.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const m = getLeadMagnet(params.slug)
  if (!m) return { title: 'Ressource nicht gefunden | candiq' }
  return m.metadata
}

export default function LeadMagnetPage({ params }: { params: { slug: string } }) {
  const m = getLeadMagnet(params.slug)
  if (!m) notFound()

  // Markdown zur Build-Zeit lesen + servieren
  const markdownPath = path.join(process.cwd(), 'content', 'resources', m.markdownPath)
  let markdown = ''
  try {
    markdown = readFileSync(markdownPath, 'utf-8')
  } catch {
    markdown = '*Inhalt konnte nicht geladen werden.*'
  }

  return (
    <>
      <section className="pt-8 pb-4 px-6 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/resources"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Alle Ressourcen
          </Link>
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-700 mb-2">
            {m.category}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter text-text-primary mb-2">
            {m.title}
          </h1>
          <p className="text-sm text-text-secondary mb-4">{m.subtitle}</p>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> {m.pageCount} Seiten
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> ~{m.readMinutes} Min Lesezeit
            </span>
          </div>
        </div>
      </section>

      <section className="py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <LeadMagnetGate slug={m.slug} title={m.title} markdown={markdown} />
        </div>
      </section>

      <section className="py-16 px-6 bg-bg-secondary print:hidden">
        <div className="max-w-3xl mx-auto card-md flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-brand-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-text-primary mb-1">
              Soll candiq Ihre nächste Reference-Check-Welle übernehmen?
            </div>
            <p className="text-sm text-text-secondary">
              15-Min-Kennenlern-Termin, individueller Setup, in 7 Tagen produktiv.
            </p>
          </div>
          <Link href={BOOKING_URL} className="btn-primary py-2.5 px-5 text-sm whitespace-nowrap">
            Termin buchen
          </Link>
        </div>
      </section>
    </>
  )
}
