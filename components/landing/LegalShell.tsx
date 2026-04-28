import Link from 'next/link'
import { LandingNav } from './LandingNav'
import { LandingFooter } from './LandingFooter'

export function LegalShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-text-primary">
      <LandingNav />
      <section className="pt-32 pb-12 px-6 relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px]"
            style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.15), transparent 60%)', filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-3xl mx-auto relative">
          <div className="text-xs font-semibold text-brand-700 uppercase tracking-widest mb-3">Rechtliches</div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tightest mb-3">{title}</h1>
          <p className="text-text-secondary">{subtitle}</p>
        </div>
      </section>
      <article className="max-w-3xl mx-auto px-6 py-16 prose prose-slate prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-10 prose-h3:text-lg prose-h3:mt-6 prose-a:text-brand-700 prose-a:no-underline hover:prose-a:underline">
        {children}
      </article>
      <LandingFooter />
    </div>
  )
}
