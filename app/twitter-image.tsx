import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'candiq — DSGVO-konforme Referenzprüfung für Recruiting'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)',
          padding: 80,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#fff',
          position: 'relative',
        }}
      >
        {/* Decorative blob top-right */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            right: -150,
            width: 600,
            height: 600,
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.10)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -200,
            left: -150,
            width: 500,
            height: 500,
            borderRadius: 9999,
            background: 'rgba(6,182,212,0.18)',
            filter: 'blur(60px)',
          }}
        />

        {/* Logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 40 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 22,
              background: 'rgba(255,255,255,0.18)',
              border: '2px solid rgba(255,255,255,0.30)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: -1,
            }}
          >
            CQ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>candiq</div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, opacity: 0.7, textTransform: 'uppercase' }}>
              Referenzprüfung
            </div>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: -2,
            lineHeight: 1.05,
            marginBottom: 36,
            maxWidth: 980,
          }}
        >
          <span>Verifizierte Referenzen.</span>
          <span style={{ opacity: 0.85 }}>Bevor Sie Ihre nächste</span>
          <span style={{ opacity: 0.85 }}>Fehlbesetzung machen.</span>
        </div>

        {/* Subline */}
        <div style={{ fontSize: 26, opacity: 0.85, fontWeight: 500, maxWidth: 900, marginBottom: 'auto' }}>
          DSGVO-konform. Server in Deutschland. Strukturierter Report in unter 48 Stunden.
        </div>

        {/* Footer pills */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {['Live-Demo ohne Anmeldung', 'CV-Auto-Parsing', '14 Tage kostenlos'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.30)',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#fde68a' }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
