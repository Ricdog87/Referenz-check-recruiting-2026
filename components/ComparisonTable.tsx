import Link from 'next/link'
import { Check, Minus, CalendarCheck, Play } from 'lucide-react'
import { BOOKING_URL } from '@/lib/site'

type Cell = { text: string; positive?: boolean }
type Row = { criterion: string; candiq: Cell; validato: Cell }

// Daten auf Basis öffentlich verfügbarer Informationen (Stand Juni 2026).
const ROWS: Row[] = [
  { criterion: 'Spezialisierung', candiq: { text: 'Referenzprüfung für Recruiting (HR & Personaldienstleister)', positive: true }, validato: { text: 'Breites Pre-Employment-Screening' } },
  { criterion: 'Hosting & Datenstandort', candiq: { text: 'Server in Deutschland 🇩🇪', positive: true }, validato: { text: 'EU-Rechenzentren · Anbieter aus der Schweiz' } },
  { criterion: 'Durchlaufzeit bis zum Report', candiq: { text: 'unter 48 h · Express 24 h', positive: true }, validato: { text: 'ca. 24 h' } },
  { criterion: 'Verifizierung', candiq: { text: 'KI-Telefonassistentin + menschliche Freigabe, positive: true }, validato: { text: 'Analysten · telefonische Interviews' } },
  { criterion: 'Preise öffentlich einsehbar', candiq: { text: 'Ja — ab 65 €/Mo · Einzelcheck 49 €', positive: true }, validato: { text: 'Auf Anfrage' } },
  { criterion: 'Monatlich kündbar · kein Mindestvertrag', candiq: { text: 'Ja', positive: true }, validato: { text: 'k. A.' } },
  { criterion: 'Self-Service-Einwilligung der Kandidaten', candiq: { text: 'Granulares Consent-Portal + Audit-Trail (Art. 6 & 7 DSGVO)', positive: true }, validato: { text: 'DSGVO-konform' } },
  { criterion: 'ATS-Integration (Personio, SAP SF, Workday)', candiq: { text: 'Ja', positive: true }, validato: { text: 'k. A.' } },
  { criterion: 'Automatische Löschung nach 180 Tagen', candiq: { text: 'Ja, per Cron-Job', positive: true }, validato: { text: 'k. A.' } },
  { criterion: 'Live-Demo ohne Anmeldung', candiq: { text: 'Ja', positive: true }, validato: { text: 'k. A.' } },
]

function Mark({ cell, accent }: { cell: Cell; accent: 'emerald' | 'muted' }) {
  return (
    <span className="inline-flex items-start gap-2">
      {cell.positive ? (
        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${accent === 'emerald' ? 'text-emerald-400' : 'text-emerald-500'}`} />
      ) : (
        <Minus className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
      )}
      <span>{cell.text}</span>
    </span>
  )
}

export function ComparisonTable({ withHeading = true }: { withHeading?: boolean }) {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {withHeading && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 mb-5">
              Ehrlicher Vergleich
            </div>
            <h2 className="text-[clamp(28px,4.5vw,44px)] font-bold tracking-tighter mb-4 text-text-primary leading-[1.1]">
              candiq oder Validato? <span className="text-gradient-brand">Der ehrliche Vergleich.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Beide verifizieren Kandidaten DSGVO-konform. Der Unterschied liegt im Detail — Datenstandort,
              Tempo, transparente Preise und wie reibungslos sich das ins Recruiting einfügt.
            </p>
          </div>
        )}

        {/* Dark-navy Tabellen-Card (Desktop) */}
        <div
          className="hidden md:block rounded-3xl overflow-hidden shadow-float border border-white/5"
          style={{ background: '#0f172a' }}
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left p-5 font-semibold w-[34%] text-slate-300" style={{ background: '#111c33' }}>
                  Kriterium
                </th>
                <th className="text-left p-5 font-bold text-white relative" style={{ background: 'linear-gradient(180deg,#10231f,#13271f)' }}>
                  <span className="inline-flex items-center gap-1">
                    cand<span className="text-emerald-400">iq</span>
                  </span>
                  <span className="absolute top-0 right-0 bg-emerald-500 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-bl-xl" style={{ color: '#04241b' }}>
                    Empfohlen
                  </span>
                </th>
                <th className="text-left p-5 font-semibold text-slate-400" style={{ background: '#1e293b' }}>
                  Validato
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.criterion} className="border-t border-white/5">
                  <td className="p-5 font-semibold text-slate-200 align-top" style={{ background: i % 2 ? '#101a2e' : '#0f172a' }}>
                    {row.criterion}
                  </td>
                  <td
                    className="p-5 align-top text-white font-medium border-l border-r border-emerald-400/25"
                    style={{ background: 'rgba(52,211,153,.10)' }}
                  >
                    <Mark cell={row.candiq} accent="emerald" />
                  </td>
                  <td className="p-5 align-top text-slate-300" style={{ background: i % 2 ? '#101a2e' : '#0f172a' }}>
                    <Mark cell={row.validato} accent="muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: pro Zeile gestapelt */}
        <div className="md:hidden space-y-4">
          {ROWS.map((row) => (
            <div key={row.criterion} className="rounded-2xl p-4 text-white shadow-card-lg" style={{ background: '#0f172a' }}>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{row.criterion}</div>
              <div className="rounded-xl p-3 mb-2 border border-emerald-400/25" style={{ background: 'rgba(52,211,153,.10)' }}>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">
                  candiq <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-[9px]" style={{ color: '#04241b' }}>Empfohlen</span>
                </div>
                <div className="text-sm text-white"><Mark cell={row.candiq} accent="emerald" /></div>
              </div>
              <div className="rounded-xl p-3 border border-white/10" style={{ background: '#111c33' }}>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Validato</div>
                <div className="text-sm text-slate-300"><Mark cell={row.validato} accent="muted" /></div>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={BOOKING_URL} className="btn-primary py-3.5 px-7 inline-flex items-center justify-center gap-2">
            <CalendarCheck className="w-4 h-4" /> 15-Min-Termin buchen
          </Link>
          <Link href="/demo" className="btn-secondary py-3.5 px-7 inline-flex items-center justify-center gap-2">
            <Play className="w-4 h-4 text-brand-600" /> Live-Demo öffnen
          </Link>
        </div>

        {/* Pflicht-Disclaimer */}
        <p className="mt-8 text-[11px] leading-relaxed text-text-muted max-w-3xl mx-auto text-center">
          Vergleich auf Basis öffentlich verfügbarer Informationen, Stand Juni 2026. Angaben zu
          Wettbewerbern ohne Gewähr — „k. A.&ldquo; bedeutet keine öffentlich einsehbare Angabe, nicht
          das Fehlen der Funktion. Marken- und Produktnamen gehören ihren jeweiligen Inhabern.
        </p>
      </div>
    </section>
  )
}
