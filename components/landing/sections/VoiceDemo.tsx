'use client'

import dynamic from 'next/dynamic'
import { ShieldCheck } from 'lucide-react'

const VoiceConsole = dynamic(() => import('./VoiceConsole'), {
  ssr: false,
  loading: () => <ConsoleSkeleton />,
})

function ConsoleSkeleton() {
  const bars = Array.from({ length: 32 })
  return (
    <>
      <div className="mt-8 flex h-24 items-center justify-center gap-1">
        {bars.map((_, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-indigo-500 to-fuchsia-400"
            style={{ height: '100%', transform: 'scaleY(0.18)', opacity: 0.35 }}
          />
        ))}
      </div>
      <div className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
        Status: <span className="text-white">BEREIT</span>
      </div>
      <div className="mt-6 h-14 w-full rounded-full bg-white/10" />
      <p className="mt-4 text-xs text-slate-400">Kostenlos · ca. 2 Min · Mikrofon erforderlich · DSGVO · Server in der EU</p>
    </>
  )
}

export default function VoiceDemo() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-10 h-[320px] w-[320px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-indigo-200">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Kandidaten-seitig · Intake &amp; Pre-Screening
        </div>

        <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          candiq Voice — der{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
            Komfort-Layer
          </span>{' '}
          für Ihre Kandidaten.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">
          Kandidaten erreichen candiq 24/7 für Intake und Terminierung — die KI nimmt ab, in unter einer Sekunde. Hören Sie selbst, wie sich das anfühlt: ein Klick, Ihre Stimme.
        </p>

        <div className="mx-auto mt-12 max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-indigo-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live · im Browser · keine Wartezeit
          </div>
          <VoiceConsole />
        </div>

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
          candiq Voice spricht mit Ihren Kandidaten — niemals mit deren Referenzgebern. Die Verifizierung läuft immer über geschulte Menschen. Mikrofonzugriff nur während dieses Demo-Gesprächs.
        </p>
      </div>
    </section>
  )
}
