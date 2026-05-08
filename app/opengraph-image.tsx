import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'candiq — DSGVO-konforme Referenzprüfung in unter 48h'
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
          justifyContent: 'space-between',
          padding: '80px',
          background:
            'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.18)',
              border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              fontWeight: 700,
              letterSpacing: '-0.04em',
            }}
          >
            c
          </div>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            candiq
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              fontSize: '76px',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              maxWidth: '960px',
            }}
          >
            DSGVO-konforme Referenzprüfung in unter 48 h.
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 400,
              opacity: 0.92,
              maxWidth: '900px',
              lineHeight: 1.3,
            }}
          >
            Verifizierte Referenzen, Zeugnisse und Tätigkeiten — Server in Deutschland, ohne Tracking.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: '24px',
            opacity: 0.85,
          }}
        >
          <div style={{ display: 'flex', gap: '24px' }}>
            <span style={{ padding: '8px 16px', borderRadius: '999px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)' }}>DSGVO-konform</span>
            <span style={{ padding: '8px 16px', borderRadius: '999px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)' }}>Live-Demo</span>
            <span style={{ padding: '8px 16px', borderRadius: '999px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)' }}>Server in DE</span>
          </div>
          <div style={{ fontWeight: 600 }}>candiq.de</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
