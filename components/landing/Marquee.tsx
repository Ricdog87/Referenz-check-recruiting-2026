'use client'

const LOGOS = [
  'TÜV Rheinland', 'Deutsche Telekom', 'Allianz', 'Siemens', 'BMW Group',
  'Lufthansa', 'SAP', 'Bayer', 'Bosch', 'DHL', 'Adidas', 'Continental',
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
          {[...LOGOS, ...LOGOS].map((l, i) => (
            <span key={i} className="text-text-muted font-semibold text-lg whitespace-nowrap tracking-tight">
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
