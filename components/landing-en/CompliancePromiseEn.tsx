'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Lock, Server, FileText } from 'lucide-react'
import { Reveal } from '../landing/Reveal'

const items = [
  { icon: ShieldCheck, label: 'GDPR-compliant', sub: 'By design' },
  { icon: Server, label: 'EU-hosted', sub: 'Servers in Germany' },
  { icon: Lock, label: 'Encrypted in transit', sub: 'HTTPS everywhere' },
  { icon: FileText, label: 'Data Processing Agreement', sub: 'Standard, included' },
]

export function CompliancePromiseEn() {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div
            className="rounded-3xl p-10 md:p-14 relative overflow-hidden text-white"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)' }}
          >
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(ellipse, #8b5cf6, transparent 60%)' }} />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(ellipse, #06b6d4, transparent 60%)' }} />

            <div className="relative grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 backdrop-blur-md mb-5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Our compliance promise
                </div>
                <h2 className="text-[clamp(28px,4vw,42px)] font-bold tracking-tighter mb-4 leading-[1.1]">
                  Compliance isn&rsquo;t <br />
                  <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-brand-300 bg-clip-text text-transparent">
                    an add-on.
                  </span>
                </h2>
                <p className="text-base text-white/70 leading-relaxed mb-6 max-w-md">
                  We handle sensitive people data — and treat it accordingly. The platform is built on
                  privacy-by-design principles, with a Data Processing Agreement ready from day one.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                  <span>Made in Germany</span>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span>Hosted in German data centres</span>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span>DPA per Art. 28 GDPR</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {items.map((it, i) => (
                  <motion.div
                    key={it.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.07 }}
                    whileHover={{ y: -4 }}
                    className="rounded-2xl p-4 bg-white/5 border border-white/10 backdrop-blur-md"
                  >
                    <it.icon className="w-5 h-5 text-cyan-300 mb-2" />
                    <div className="text-sm font-semibold text-white">{it.label}</div>
                    <div className="text-[11px] text-white/60 mt-0.5">{it.sub}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
