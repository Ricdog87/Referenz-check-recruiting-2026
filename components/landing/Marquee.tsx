'use client'

import { ShieldCheck, Server, FileCheck2, Lock, BadgeCheck, Globe2 } from 'lucide-react'

// Compliance-/Trust-Punkte statt erfundener Kundenlogos.
// Echte Kundenreferenzen wandern hier rein, sobald NDA-Freigaben da sind.
const TRUST_ITEMS = [
  { icon: ShieldCheck, label: 'DSGVO Art. 6, 17, 20, 28' },
  { icon: Server, label: 'Server in Deutschland' },
  { icon: Lock, label: 'AES-256 Verschlüsselung' },
  { icon: FileCheck2, label: 'Audit-Trail · 24 Monate' },
  { icon: BadgeCheck, label: 'AVV inklusive' },
  { icon: Globe2, label: 'Made in Germany' },
]

export function Marquee() {
  return (
    <div className="relative overflow-hidden py-6">
      <div
        className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, var(--bg-secondary, #f8fafc), transparent)' }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, var(--bg-secondary, #f8fafc), transparent)' }}
      />
      <div className="marquee">
        <div className="marquee-track">
          {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 text-text-secondary font-semibold text-sm whitespace-nowrap tracking-tight"
            >
              <item.icon className="w-4 h-4 text-brand-600" />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
