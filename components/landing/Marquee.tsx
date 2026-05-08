'use client'

// Generische Zielgruppen-Labels — bewusst KEINE echten Firmennamen.
// candiq verwendet nur Logos, mit denen eine bestätigte Kundenbeziehung
// und schriftliche Freigabe für die Logo-Nutzung besteht.
const LABELS = [
  'DAX-Konzerne', 'Mittelstand 200+ MA', 'Personaldienstleister',
  'HR-Boutiquen', 'Banken & Finance', 'Versicherungen',
  'Industrie & Maschinenbau', 'Healthcare & Pharma',
  'Tech & SaaS', 'Logistik & Mobility', 'Beratung & Consulting',
  'Öffentlicher Sektor',
]

export function Marquee() {
  return (
    <div className="relative overflow-hidden py-6">
      <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #ffffff, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #ffffff, transparent)' }} />
      <div className="marquee">
        <div className="marquee-track">
          {[...LABELS, ...LABELS].map((l, i) => (
            <span key={i} className="text-text-muted font-semibold text-base whitespace-nowrap tracking-tight">
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
