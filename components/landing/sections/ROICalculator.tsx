'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Calculator, TrendingUp, ShieldCheck } from 'lucide-react'
import { Reveal } from '../Reveal'

export function ROICalculator() {
  const [hires, setHires] = useState(20)
  const [avgSalary, setAvgSalary] = useState(70000)
  const [misHireRate, setMisHireRate] = useState(15)

  const misHires = (hires * misHireRate) / 100
  const misHireCost = misHires * avgSalary * 1.5
  // candiq reduces mishire rate by ~60% based on industry data
  const newMisHires = misHires * 0.4
  const savedCost = (misHires - newMisHires) * avgSalary * 1.5
  const refCheckCost = hires * 39 * 12 // assume Pro plan ~ avg
  const netRoi = savedCost - refCheckCost

  return (
    <section className="py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-[600px] h-[400px] -translate-y-1/2 opacity-20"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.5), transparent 60%)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/2 right-0 w-[500px] h-[400px] -translate-y-1/2 opacity-20"
          style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.45), transparent 60%)', filter: 'blur(80px)' }} />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
              ROI-Rechner
            </div>
            <h2 className="text-[clamp(28px,4.5vw,44px)] font-bold tracking-tighter mb-5 text-text-primary">
              Was kostet Sie eine <span className="text-gradient-brand">Fehlbesetzung?</span>
            </h2>
            <p className="text-base text-text-secondary leading-relaxed">
              Bewegen Sie die Regler — wir zeigen Ihnen, wie viel candiq Ihnen jährlich spart.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="grid md:grid-cols-[1fr_1.1fr] gap-6">
            {/* Inputs */}
            <div className="card-lg shadow-card-lg space-y-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-2">
                <Calculator className="w-5 h-5 text-brand-600" />
                Ihre Recruiting-Zahlen
              </div>

              <Slider
                label="Einstellungen pro Jahr"
                value={hires}
                onChange={setHires}
                min={5}
                max={500}
                step={5}
                format={(v) => `${v} Hires`}
              />
              <Slider
                label="Ø Jahresgehalt (Brutto)"
                value={avgSalary}
                onChange={setAvgSalary}
                min={40000}
                max={150000}
                step={5000}
                format={(v) => `${v.toLocaleString('de-DE')} €`}
              />
              <Slider
                label="Aktuelle Fehlbesetzungs-Quote"
                value={misHireRate}
                onChange={setMisHireRate}
                min={5}
                max={30}
                step={1}
                format={(v) => `${v} %`}
              />
            </div>

            {/* Output */}
            <motion.div
              key={`${hires}-${avgSalary}-${misHireRate}`}
              initial={{ scale: 0.98, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl p-8 text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)', boxShadow: '0 20px 60px -10px rgba(79,70,229,0.5)' }}
            >
              {/* Decorative pattern */}
              <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Ihr potenzielles Einsparungs-Potenzial
                </div>
                <div className="text-5xl md:text-6xl font-black tracking-tighter mb-1">
                  {netRoi > 0 ? `${Math.round(netRoi).toLocaleString('de-DE')} €` : '—'}
                </div>
                <div className="text-sm text-white/80 mb-8">netto pro Jahr (nach Abzug der candiq-Kosten)</div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/15">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-white/60 font-semibold mb-1">Vorher</div>
                    <div className="text-2xl font-bold">{Math.round(misHireCost).toLocaleString('de-DE')} €</div>
                    <div className="text-xs text-white/60 mt-1">{misHires.toFixed(1)} Fehlbesetzungen</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-white/60 font-semibold mb-1">Mit candiq</div>
                    <div className="text-2xl font-bold">{Math.round(misHireCost * 0.4).toLocaleString('de-DE')} €</div>
                    <div className="text-xs text-white/60 mt-1">{newMisHires.toFixed(1)} Fehlbesetzungen (−60 %)</div>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-2 text-xs text-white/70">
                  <ShieldCheck className="w-4 h-4" /> Modell basiert auf SHRM- &amp; Bain-Studien zu Fehlbesetzungskosten
                </div>
              </div>
            </motion.div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Slider({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (n: number) => void;
  min: number; max: number; step: number; format: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{label}</label>
        <span className="text-sm font-bold text-brand-700 tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-bg-tertiary"
        style={{
          background: `linear-gradient(to right, #4f46e5 0%, #8b5cf6 ${pct}%, rgb(241 245 249) ${pct}%, rgb(241 245 249) 100%)`,
        }}
      />
      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: white;
          border: 2px solid #6366f1;
          box-shadow: 0 2px 6px rgba(79,70,229,0.4);
          cursor: grab;
        }
        input[type='range']::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: white;
          border: 2px solid #6366f1;
          box-shadow: 0 2px 6px rgba(79,70,229,0.4);
          cursor: grab;
        }
      `}</style>
    </div>
  )
}
