'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, CalendarClock, BadgeCheck, UserSearch, BookCheck, ShieldCheck, Sparkles, Play, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Reveal } from '../Reveal'

const checks = [
  {
    icon: Building2,
    title: 'Firma existiert wirklich',
    body: 'Wir gleichen Arbeitgeber gegen Handelsregister und öffentliche Quellen ab. Ghost-Companies und reine Fassaden fallen vor dem Anruf auf.',
  },
  {
    icon: CalendarClock,
    title: 'Zeitlinien sind konsistent',
    body: 'Überschneidende Voll­zeit­stellen, unerklärte Lücken oder rückwärts geschriebene Karrieren fallen sofort auf — bevor jemand interviewen geht.',
  },
  {
    icon: BadgeCheck,
    title: 'Titel und Dauer stimmen mit der Referenz überein',
    body: 'Der geschulte Reviewer bestätigt die im CV genannte Rolle und Dauer direkt beim Referenzgeber. Aufgeplusterte Titel werden im Report markiert.',
  },
  {
    icon: UserSearch,
    title: 'Der Referenzgeber ist eine echte Person',
    body: 'Wir validieren Rolle, Firma und Erreichbarkeit. Erfundene Vorgesetzte und gefälschte E-Mail-Adressen fallen auf — Reviewer ruft an, nie ein Bot.',
  },
  {
    icon: BookCheck,
    title: 'Substanz statt Schreibstil',
    body: 'Wir bewerten Aussagen zu konkreten Projekten und Ergebnissen — nicht Sprache, Stil, Akzent oder Herkunft. Streng AGG-konform.',
  },
]

export function FabricationCheck() {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] opacity-25"
          style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.25), transparent 65%)', filter: 'blur(80px)' }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Fabrikations-Check
            </div>
            <h2 className="text-[clamp(28px,4.5vw,46px)] font-bold tracking-tighter mb-5 text-text-primary leading-[1.1]">
              Hör auf zu fragen, <span className="text-text-secondary line-through decoration-rose-400/60">wer</span> den Lebenslauf geschrieben hat.<br className="hidden sm:block" />
              <span className="text-gradient-brand">Frag, ob er wahr ist.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Den CV-Schreibstil zu analysieren ist 2022 — und gegen Diskriminierung schwer verteidigbar. candiq prüft die Substanz: Existiert die Firma? Stimmen die Zeiträume? Ist der Referenzgeber echt? Substanz ist nicht fälschbar, ohne dass es jemand bemerkt.
            </p>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mb-10">
          <Reveal>
            <ul className="space-y-3">
              {checks.map((c) => (
                <li key={c.title} className="card-md flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center flex-shrink-0">
                    <c.icon className="w-5 h-5 text-brand-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">{c.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* candiq Verified Siegel */}
          <Reveal delay={0.15}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-brand-700 text-white shadow-float p-7 h-full overflow-hidden flex flex-col"
            >
              <div
                className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-30 blur-3xl"
                style={{ background: 'radial-gradient(ellipse, #fbbf24, transparent 60%)' }}
              />
              <div className="relative flex-1 flex flex-col">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/15 border border-white/25 backdrop-blur-md w-fit mb-4">
                  <ShieldCheck className="w-3 h-3 text-amber-200" /> Auf jedem Report
                </div>
                <h3 className="text-2xl font-black tracking-tightest mb-3">candiq Verified</h3>
                <p className="text-sm text-white/90 leading-relaxed mb-5">
                  Jeder freigegebene Report trägt das candiq-Verified-Siegel — ein teilbares Vertrauens-Asset für Hiring-Manager, Geschäftsführung und Compliance. Verteidigbar gegenüber Wirtschaftsprüfern, lesbar in unter 30 Sekunden.
                </p>
                <ul className="space-y-2 text-xs text-white/85 mt-auto">
                  <li className="flex items-start gap-2"><Sparkles className="w-3.5 h-3.5 mt-0.5 text-amber-200 flex-shrink-0" /> Inkl. Audit-Trail-Verweis</li>
                  <li className="flex items-start gap-2"><Sparkles className="w-3.5 h-3.5 mt-0.5 text-amber-200 flex-shrink-0" /> Substanz-Bewertung pro Station</li>
                  <li className="flex items-start gap-2"><Sparkles className="w-3.5 h-3.5 mt-0.5 text-amber-200 flex-shrink-0" /> Eindeutige Hire-/Hold-/Reject-Empfehlung</li>
                </ul>
              </div>
            </motion.div>
          </Reveal>
        </div>

        <Reveal>
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-bg-secondary p-5 text-center">
            <p className="text-xs text-text-muted leading-relaxed">
              <strong className="text-text-secondary">AGG-Hinweis:</strong> candiq bewertet ausschließlich verifizierbare Substanz —
              Position, Dauer, Tätigkeit, Diskrepanz zur Eigenangabe. Keine Bewertung von Sprache, Stil, Akzent, Herkunft oder anderen
              nach § 1 AGG geschützten Merkmalen. Wir prüfen, was war — nicht, wer es geschrieben hat.
            </p>
          </div>
        </Reveal>

        <LiveDemo />
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// Live-Demo-Widget: ruft /api/cv-analysis/preview mit zwei vordefinierten
// Demo-CVs auf und rendert den Risk-Score, RAG, Sub-Scores und Top-Flags
// in Echtzeit. Kein Auth, kein DB-Write, rate-limited 10/h pro IP.
// ─────────────────────────────────────────────────────────────────

type PreviewReport = {
  riskScore: number
  rag: 'green' | 'amber' | 'red'
  subScores: { timeline: number; employer: number; referee: number; claims: number }
  flags: { claim: string; type: string; severity: 'low' | 'medium' | 'high'; reason: string; source: string }[]
  verificationChecklist: string[]
}

const PRESET_CLEAN = {
  consentGiven: true,
  stations: [
    { company: 'Candiq GmbH', title: 'Recruiting Specialist', startDate: '2020-01', endDate: '2022-12', location: 'Berlin' },
    { company: 'Trust People GmbH', title: 'People Operations Manager', startDate: '2023-01', endDate: 'present', location: 'Hamburg' },
  ],
  education: [{ institution: 'Hochschule Beispielstadt', degree: 'M.A. Human Resources', startDate: '2017', endDate: '2019' }],
  certifications: [{ name: 'Certified HR Manager', issuer: 'HR Verband', year: 2021 }],
  referees: [{ name: 'Mara Manager', company: 'Trust People GmbH', role: 'Head of People', email: 'mara.manager@trustpeople.com' }],
}

const PRESET_FAKE = {
  consentGiven: true,
  rawCvText: 'Kandidat behauptet mehrere parallele Senior-Rollen und schnelle Beförderungen.',
  stations: [
    { company: 'Alpha GmbH', title: 'Intern', startDate: '2025-01', endDate: '2025-03', location: 'Berlin' },
    { company: 'Beta AG', title: 'Head of Sales', startDate: '2025-06', endDate: '2026-12', location: 'Remote' },
    { company: 'Gamma GmbH', title: 'Director Operations', startDate: '2025-08', endDate: '2025-12', location: 'München' },
  ],
  education: [{ institution: 'Universität Beispiel', degree: 'B.Sc.', startDate: '2018', endDate: '2021' }],
  certifications: [{ name: 'Example Security Lead', issuer: 'Example Org', year: 2026 }],
  referees: [{ name: 'Jane Ref', company: 'Beta AG', role: 'Friend', email: 'janeref@gmail.com' }],
}

const RAG_STYLE: Record<PreviewReport['rag'], { label: string; pill: string; ring: string; emoji: string }> = {
  green: { label: 'Niedriges Risiko', pill: 'bg-emerald-100 text-emerald-800 border-emerald-200', ring: 'ring-emerald-300', emoji: '✓' },
  amber: { label: 'Prüfung empfohlen', pill: 'bg-amber-100 text-amber-800 border-amber-200', ring: 'ring-amber-300', emoji: '⚠' },
  red: { label: 'Hohes Fabrikations-Risiko', pill: 'bg-rose-100 text-rose-800 border-rose-200', ring: 'ring-rose-300', emoji: '⛔' },
}

const SEVERITY_PILL: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-rose-100 text-rose-800 border-rose-200',
}

function LiveDemo() {
  const [loading, setLoading] = useState<null | 'clean' | 'fake'>(null)
  const [active, setActive] = useState<null | 'clean' | 'fake'>(null)
  const [report, setReport] = useState<PreviewReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(kind: 'clean' | 'fake') {
    setLoading(kind)
    setActive(kind)
    setError(null)
    setReport(null)
    try {
      const res = await fetch('/api/cv-analysis/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kind === 'clean' ? PRESET_CLEAN : PRESET_FAKE),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Preview konnte nicht berechnet werden.')
        return
      }
      setReport(data.report as PreviewReport)
    } catch (e: any) {
      setError(e?.message ?? 'Netzwerkfehler.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Reveal>
      <div className="mt-14 max-w-5xl mx-auto">
        <div className="rounded-3xl border border-border bg-white shadow-card-md overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-bg-secondary/60">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-700 mb-1">
                <Play className="w-3 h-3" /> Live-Demo
              </div>
              <div className="text-base font-bold text-text-primary">Probieren Sie den Fabrikations-Check direkt aus</div>
              <p className="text-xs text-text-muted mt-1">Zwei Beispiel-CVs, echte Berechnung — die deterministischen Checks und das Scoring laufen serverseitig in Echtzeit.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => run('clean')}
                disabled={loading !== null}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  active === 'clean' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                {loading === 'clean' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Sauberer CV
              </button>
              <button
                type="button"
                onClick={() => run('fake')}
                disabled={loading !== null}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  active === 'fake' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                }`}
              >
                {loading === 'fake' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                Verdächtiger CV
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {error && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {error}
              </div>
            )}

            {!error && !report && (
              <div className="text-center py-12 text-sm text-text-muted">
                Wählen Sie einen der zwei Beispiel-CVs oben. Wir senden die Daten an{' '}
                <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded">/api/cv-analysis/preview</code>{' '}
                und zeigen den echten Risk-Report.
              </div>
            )}

            {report && (
              <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
                {/* Risk-Score + Sub-Scores */}
                <div>
                  <div className={`rounded-2xl border bg-white p-6 text-center ring-4 ${RAG_STYLE[report.rag].ring} ring-offset-4 ring-offset-white`}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Risk-Score</div>
                    <div className="text-6xl font-black tracking-tightest text-text-primary mb-1" style={{ fontFeatureSettings: '"tnum"' }}>
                      {report.riskScore}
                    </div>
                    <div className="text-xs text-text-muted mb-4">von 100</div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${RAG_STYLE[report.rag].pill}`}>
                      {RAG_STYLE[report.rag].emoji} {RAG_STYLE[report.rag].label}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {(['timeline', 'employer', 'referee', 'claims'] as const).map((k) => {
                      const label = ({ timeline: 'Zeitlinie', employer: 'Arbeitgeber', referee: 'Referenzgeber', claims: 'Behauptungen' } as const)[k]
                      const v = report.subScores[k]
                      const color = v >= 70 ? 'bg-rose-500' : v >= 35 ? 'bg-amber-500' : 'bg-emerald-500'
                      return (
                        <div key={k}>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-text-secondary">{label}</span>
                            <span className="font-bold text-text-primary" style={{ fontFeatureSettings: '"tnum"' }}>{v}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                            <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${v}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Flags + Checklist */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
                    Aufgedeckte Hinweise ({report.flags.length})
                  </div>
                  {report.flags.length === 0 ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Keine Fabrikations-Hinweise.</div>
                        Dieser CV passt zur typischen sauberen Bewerbung. Der Reviewer-Anruf bleibt der finale Beweis — Ihr Audit-Trail steht.
                      </div>
                    </div>
                  ) : (
                    <ul className="space-y-2 mb-4">
                      {report.flags.slice(0, 5).map((f, i) => (
                        <li key={i} className="rounded-xl border border-border bg-bg-secondary/50 p-3">
                          <div className="flex items-start gap-2 mb-1">
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${SEVERITY_PILL[f.severity]}`}>
                              {f.severity}
                            </span>
                            <span className="text-[10px] font-mono text-text-muted">{f.type}</span>
                          </div>
                          <div className="text-xs font-semibold text-text-primary mb-0.5">{f.claim}</div>
                          <div className="text-xs text-text-secondary leading-relaxed">{f.reason}</div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {report.verificationChecklist.length > 0 && (
                    <>
                      <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 mt-4">
                        Prüf-Checkliste für den Reviewer
                      </div>
                      <ul className="space-y-1.5 text-xs text-text-secondary">
                        {report.verificationChecklist.slice(0, 5).map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border bg-bg-secondary/40 text-[10px] text-text-muted flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div>Preview-Modus · echte deterministische Checks · keine Persistenz · rate-limited 10/h/IP</div>
            <div>Im Dashboard inkl. LLM-Claim-Layer, Audit-Trail und Reviewer-Übergabe</div>
          </div>
        </div>
      </div>
    </Reveal>
  )
}
