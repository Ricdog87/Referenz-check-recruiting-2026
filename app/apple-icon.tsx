import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width="120"
          height="120"
          alt=""
          src={`data:image/svg+xml;utf8,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
              <path d='M 47.5 16.5 A 22 22 0 1 0 47.5 47.5' fill='none' stroke='#ffffff' stroke-width='10' stroke-linecap='round'/>
              <circle cx='42' cy='22' r='4.5' fill='#0f172a'/>
              <line x1='44' y1='44' x2='58' y2='58' stroke='#0f172a' stroke-width='8' stroke-linecap='round'/>
            </svg>`
          )}`}
        />
      </div>
    ),
    { ...size }
  )
}
