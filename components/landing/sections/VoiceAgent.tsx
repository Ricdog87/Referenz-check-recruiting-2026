'use client'

import { useEffect, createElement } from 'react'

const AGENT_ID = 'agent_9601ktktemgwfk3tey407mkkxnc5'

export function VoiceAgent() {
  useEffect(() => {
    if (!document.getElementById('elevenlabs-convai-script')) {
      const s = document.createElement('script')
      s.id = 'elevenlabs-convai-script'
      s.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed'
      s.async = true
      s.type = 'text/javascript'
      document.body.appendChild(s)
    }
    const mount = document.getElementById('candiq-voice-mount')
    if (mount && mount.childElementCount === 0) {
      const w = document.createElement('elevenlabs-convai')
      w.setAttribute('agent-id', AGENT_ID)
      mount.appendChild(w)
    }
  }, [])

return createElement(
  'section',
  { id: 'ki-agentin', className: 'relative py-24 px-6 overflow-hidden' },
  createElement(
    'div',
    { className: 'max-w-3xl mx-auto text-center' },
    createElement('div', { className: 'inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-brand-200 shadow-card text-text-primary' }, 'Live · Im Browser · Keine Wartezeit'),
    createElement('h2', { className: 'text-[clamp(32px,5vw,52px)] font-bold leading-tight tracking-tightest mb-5 text-text-primary' }, 'Sprich mit unserer KI-Agentin.'),
    createElement('p', { className: 'text-lg text-text-secondary leading-relaxed max-w-xl mx-auto mb-10' }, 'Lies nicht über KI-Telefonie — erlebe sie. Ein Klick, deine Stimme, Antwort in Sekunden.'),
    createElement('div', { id: 'candiq-voice-mount', className: 'flex justify-center min-h-[96px]' }),
    createElement('p', { className: 'text-xs text-text-muted mt-8' }, 'Kostenlos · Mikrofon erforderlich · DSGVO · Server in der EU')
    )
  )
}
