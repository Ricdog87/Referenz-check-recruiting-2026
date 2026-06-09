'use client'

import { useCallback, useState } from 'react'
import { ConversationProvider, useConversation } from '@elevenlabs/react'
import { Mic, PhoneOff, Loader2 } from 'lucide-react'

const AGENT_ID = 'agent_9601ktktemgwfk3tey407mkkxnc5'

function Waveform({ active }: { active: boolean }) {
  const bars = Array.from({ length: 32 })
  return (
    <div className="mt-8 flex h-24 items-center justify-center gap-1">
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
  const conversation = useConversation({
    onError: () => setError('Verbindung fehlgeschlagen. Bitte erneut versuchen.'),
  })

  const status = conversation.status
  const isActive = status === 'connected'
  const isConnecting = status === 'connecting' || starting
  const isSpeaking = conversation.isSpeaking

  const start = useCallback(async () => {
    setError(null)
    setStarting(true)
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      conversation.startSession({ agentId: AGENT_ID, connectionType: 'webrtc' })
    } catch {
      setError('Mikrofon nicht freigegeben oder Verbindung fehlgeschlagen.')
    } finally {
      setStarting(false)
    }
  }, [conversation])

  const stop = useCallback(() => {
    conversation.endSession()
  }, [conversation])

  const statusLabel = isActive ? (isSpeaking ? 'KI SPRICHT' : 'HÖRT ZU') : isConnecting ? 'VERBINDE…' : 'BEREIT'

  return (
    <>
      <Waveform active={isActive} />
      <div className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
        Status: <span className="text-white">{statusLabel}</span>
      </div>
      <button
        type="button"
        onClick={isActive ? stop : start}
        disabled={isConnecting}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-60"
      >
        {isConnecting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isActive ? (
          <PhoneOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
        {isConnecting ? 'Verbinde…' : isActive ? 'Gespräch beenden' : 'Mit der KI-Telefonassistentin sprechen'}
      </button>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      <p className="mt-4 text-xs text-slate-400">Kostenlos · ca. 2 Min · Mikrofon erforderlich · DSGVO · Server in der EU</p>
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
