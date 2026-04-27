import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'RefCheck — Die Wahrheit hinter jeder Bewerbung'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #0a0f1a 50%, #000000 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 800,
            height: 400,
            background: 'radial-gradient(ellipse, rgba(10,132,255,0.18) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: '#0a84ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(10,132,255,0.5)',
            }}
          >
            <span style={{ color: 'white', fontSize: 20, fontWeight: 800 }}>RC</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 28, fontWeight: 700 }}>
            RefCheck
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 62,
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: 900,
            marginBottom: 24,
          }}
        >
          Die Wahrheit hinter
          <br />
          <span style={{ color: '#0a84ff' }}>jeder Bewerbung.</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            color: 'rgba(255,255,255,0.45)',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.5,
            marginBottom: 48,
          }}
        >
          DSGVO-konforme Referenzprüfung für B2B-Recruiting.
          Server in Deutschland.
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 60 }}>
          {[
            { n: '94%', t: 'Verifizierungsquote' },
            { n: '<48h', t: 'Durchlaufzeit' },
            { n: '100%', t: 'DSGVO-konform' },
          ].map((s) => (
            <div
              key={s.t}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: 'white',
                  letterSpacing: '-0.02em',
                }}
              >
                {s.n}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
                {s.t.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
