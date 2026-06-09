'use client'

import { useCallback, useEffect, useState } from 'react'
import { useConversation } from '@elevenlabs/react'
import { Mic, PhoneOff, Loader2, ShieldCheck } from 'lucide-react'

const AGENT_ID = 'agent_9601ktktemgwfk3tey407mkkxnc5'

export default function VoiceDemo() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <section className="relative overflow-hidden bg-slate-950 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-10 h-[320px] w-[320px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-indigo-200">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Neu · candiq Voice
        </div>

        <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Erleben Sie Ihre{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
            KI-Telefonassistentin
          </span>{' '}
          — live.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">
          Nicht über KI-Telefonie lesen — hören Sie selbst. Ein Klick, Ihre Stimme, Antwort in unter einer Sekunde.
        </p>

        <VoiceCard mounted={mounted} />

        <div className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-4">
          {[
            { v: '< 1 Sek', k: 'Antwortzeit' },
            { v: '24/7', k: 'erreichbar' },
            { v: 'DSGVO', k: 'EU-Server' },
          ].map((s) => (
            <div key={s.k}>
              <div className="text-2xl font-semibold text-white">{s.v}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">{s.k}</div>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 flex max-w-md items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Live-Demo mit unserer KI-gestützten, trainierten Telefonassistentin. Mikrofonzugriff nur während des Gesprächs. Jeder echte Reference-Report wird von geschulten Reviewern freigegeben.
        </p>
      </div>

      <style>{'@keyframes candiqWave{0%,100%{transform:scaleY(0.18)}50%{transform:scaleY(1)}}'}</style>
    </section>
  )
}

function VoiceCard({ mounted }: { mounted: boolean }) {
  return (
    <div className="mx-auto mt-12 max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-indigo-300">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Live · im Browser · keine Wartezeit
      </div>
      {mounted ? <VoiceConsole /> : <VoiceConsoleSkeleton />}
    </div>
  )
}

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

function VoiceConsoleSkeleton() {
  return (
    <>
      <Waveform active={false} />
      <div className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
        Status: <span className="text-white">BEREIT</span>
      </div>
      <div className="mt-6 h-14 w-full rounded-full bg-white/10" />
      <p className="mt-4 text-xs text-slate-400">Kostenlos · ca. 2 Min · Mikrofon erforderlich · DSGVO · Server in der EU</p>
    </>
  )
}

function VoiceConsole() {
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
      await conversation.startSession({ agentId: AGENT_ID, connectionType: 'webrtc' })
    } catch {
      setError('Mikrofon nicht freigegeben oder Verbindung fehlgeschlagen.')
    } finally {
      setStarting(false)
    }
  }, [conversation])

  const stop = useCallback(async () => {
    try {
      await conversation.endSession()
    } catch {
      /* noop */
    }
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
