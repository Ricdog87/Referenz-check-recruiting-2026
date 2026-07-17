'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ConversationProvider, useConversation } from '@elevenlabs/react'
import { Mic, PhoneOff, Loader2 } from 'lucide-react'
import { trackConversion } from '@/lib/conversionTracking'
import { resolveAgentId } from '@/lib/voice-config'

// Konfigurierbar via NEXT_PUBLIC_ELEVENLABS_AGENT_ID; Default = Prod-Agent (G23).
const AGENT_ID = resolveAgentId()

function Waveform({ active }: { active: boolean }) {
  const bars = Array.from({ length: 32 })
  return (
    <div className="mt-5 sm:mt-8 flex h-16 sm:h-24 items-center justify-center gap-1">
      {bars.map((_, i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-indigo-500 to-fuchsia-400"
          style={{
            height: '100%',
            transformOrigin: 'center',
            transform: active ? undefined : 'scaleY(0.18)',
            opacity: active ? 1 : 0.35,
            animation: active ? 'candiqWave 1.1s ease-in-out ' + ((i % 8) * 0.08) + 's infinite' : 'none',
          }}
        />
      ))}
    </div>
  )
}

function Console() {
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const startedAtRef = useRef<number | null>(null)
  const conversation = useConversation({
    onError: (message) => {
      console.error('[candiq voice]', message)
      const text = typeof message === 'string' && message ? message : 'Verbindung fehlgeschlagen'
      setError(text)
      setStarting(false)
    },
  })

  const status = conversation.status
  const isActive = status === 'connected'
  const isConnecting = starting || status === 'connecting'
  const isSpeaking = conversation.isSpeaking

  useEffect(() => {
    if (status === 'connected' || status === 'error') setStarting(false)
  }, [status])

  const start = useCallback(() => {
    // Graceful-Degradation (G23): ohne konfigurierte Agent-ID keine leere
    // Session starten, sondern freundlich abweisen.
    if (!AGENT_ID) {
      setError('Voice-Demo ist derzeit nicht verfügbar.')
      return
    }
    setError(null)
    setStarting(true)
    startedAtRef.current = Date.now()
    trackConversion('voice_demo_start')
    try {
      conversation.startSession({ agentId: AGENT_ID, connectionType: 'websocket' })
    } catch (e) {
      console.error('[candiq voice] start', e)
      setError(e instanceof Error ? e.message : 'Verbindung konnte nicht gestartet werden.')
      setStarting(false)
    }
  }, [conversation])

  const stop = useCallback(() => {
    const seconds = startedAtRef.current ? Math.round((Date.now() - startedAtRef.current) / 1000) : 0
    trackConversion('voice_demo_end', { duration_seconds: seconds })
    startedAtRef.current = null
    conversation.endSession()
  }, [conversation])

  const statusLabel = isActive ? (isSpeaking ? 'KI SPRICHT' : 'HÖRT ZU') : isConnecting ? 'VERBINDE…' : 'BEREIT'

  return (
    <>
      <Waveform active={isActive} />
      <div className="mt-3 sm:mt-6 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
        Status: <span className="text-white">{statusLabel}</span>
      </div>
      <button
        type="button"
        onClick={isActive ? stop : start}
        disabled={isConnecting || !AGENT_ID}
        className="mt-3 sm:mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-3.5 sm:py-4 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-60"
      >
        {isConnecting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isActive ? (
          <PhoneOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
        {isConnecting ? 'Verbinde…' : isActive ? 'Gespräch beenden' : 'candiq Voice ausprobieren'}
      </button>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      <p className="mt-2 sm:mt-4 text-[11px] sm:text-xs text-slate-400">Kostenlos &middot; ca. 2 Min &middot; Mikrofon erforderlich &middot; DSGVO &middot; Server in der EU</p>
    </>
  )
}

export default function VoiceConsole() {
  return (
    <ConversationProvider>
      <Console />
    </ConversationProvider>
  )
}
