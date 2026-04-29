'use client'

import { motion, useMotionValue, useTransform, useSpring, useScroll } from 'framer-motion'
import { useRef, useState } from 'react'
import { CheckCircle2, ShieldCheck, AlertCircle, Sparkles, Phone, FileText } from 'lucide-react'

/**
 * 3D Hero Card Stack — gives the page real depth.
 * - The user's mouse tilts the entire stack on X/Y axes.
 * - On scroll the stack lifts further into the page.
 */
export function Hero3D() {
  const ref = useRef<HTMLDivElement>(null)
  const [mouseInside, setMouseInside] = useState(false)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const rotateY = useSpring(useTransform(mx, [-1, 1], [-12, 12]), { stiffness: 120, damping: 20 })
  const rotateX = useSpring(useTransform(my, [-1, 1], [10, -10]), { stiffness: 120, damping: 20 })

  // scroll-driven lift
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const scrollLift = useTransform(scrollYProgress, [0, 1], [0, -90])

  function onMouseMove(e: React.MouseEvent) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mx.set(x * 2)
    my.set(y * 2)
  }

  function onLeave() {
    mx.set(0)
    my.set(0)
    setMouseInside(false)
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setMouseInside(true)}
      onMouseLeave={onLeave}
      className="relative w-full max-w-[640px] mx-auto perspective-2000"
      style={{ height: 480 }}
    >
      <motion.div
        style={{
          rotateX: mouseInside ? rotateX : 8,
          rotateY: mouseInside ? rotateY : -8,
          y: scrollLift,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-full"
      >
        {/* Background glow */}
        <div
          className="absolute inset-10 rounded-[40px] blur-3xl opacity-60"
          style={{
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.45), rgba(139,92,246,0.25) 60%, transparent)',
            transform: 'translateZ(-100px)',
          }}
        />

        {/* Back card — Stats */}
        <motion.div
          className="absolute top-2 left-8 right-8 rounded-2xl p-5 bg-white border border-border shadow-card-lg"
          style={{ transform: 'translateZ(40px) translateY(-20px)' }}
          animate={{ y: [-20, -28, -20] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Heutige Prüfungen</div>
            <span className="badge-success">+18 %</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { v: '247', l: 'Verifiziert', c: 'text-emerald-600' },
              { v: '12', l: 'Diskrepanz', c: 'text-rose-600' },
              { v: '94 %', l: 'Quote', c: 'text-brand-600' },
            ].map((s) => (
              <div key={s.l}>
                <div className={`text-2xl font-bold ${s.c}`} style={{ fontFeatureSettings: '"tnum"' }}>{s.v}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider">{s.l}</div>
              </div>
            ))}
          </div>
          {/* mini sparkline */}
          <svg viewBox="0 0 200 40" className="w-full h-10 mt-3">
            <defs>
              <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,28 L20,22 L40,26 L60,18 L80,20 L100,12 L120,16 L140,8 L160,10 L180,4 L200,8 L200,40 L0,40 Z" fill="url(#grad1)" />
            <path d="M0,28 L20,22 L40,26 L60,18 L80,20 L100,12 L120,16 L140,8 L160,10 L180,4 L200,8" stroke="#6366f1" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </motion.div>

        {/* Middle card — Reference check in progress */}
        <motion.div
          className="absolute top-32 left-2 right-32 rounded-2xl p-5 bg-white border border-border shadow-card-xl"
          style={{ transform: 'translateZ(80px)' }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center shadow-glow flex-shrink-0">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-text-primary">Telekom AG</span>
                <span className="badge-warning text-[10px]">Live-Call</span>
              </div>
              <div className="text-xs text-text-muted mb-2">M. Schmidt · Senior Engineer · 2021–2024</div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-brand-500 to-violet rounded-full"
                    initial={{ width: '20%' }}
                    animate={{ width: ['20%', '78%', '20%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
                <span className="text-[10px] font-mono text-text-muted">02:14</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Front card — Result */}
        <motion.div
          className="absolute bottom-8 left-16 right-4 rounded-2xl p-5 bg-white border border-border shadow-card-xl"
          style={{ transform: 'translateZ(140px)' }}
          animate={{ y: [10, 0, 10] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-text-primary">Referenz verifiziert</span>
                <span className="badge-success text-[10px]">SAP SE</span>
              </div>
              <div className="text-xs text-text-secondary leading-relaxed">
                Position, Zeitraum & Tätigkeiten bestätigt. Ehemaliger Vorgesetzter empfiehlt Kandidat ausdrücklich.
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-1 text-[10px] text-text-muted">
              <ShieldCheck className="w-3 h-3" /> DSGVO-protokolliert
            </div>
            <div className="flex items-center gap-1 text-[10px] text-text-muted">
              <FileText className="w-3 h-3" /> Report PDF
            </div>
          </div>
        </motion.div>

        {/* Floating discrepancy badge */}
        <motion.div
          className="absolute top-44 right-0 rounded-2xl p-3 bg-white border border-rose-200 shadow-card-lg flex items-center gap-2.5"
          style={{ transform: 'translateZ(180px)' }}
          animate={{ y: [0, -14, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <div className="text-xs font-semibold text-text-primary">Diskrepanz</div>
            <div className="text-[10px] text-text-muted">Position weicht ab</div>
          </div>
        </motion.div>

        {/* Sparkles */}
        <motion.div
          className="absolute top-6 right-12 text-amber-400"
          style={{ transform: 'translateZ(200px)' }}
          animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
          transition={{ rotate: { duration: 12, repeat: Infinity, ease: 'linear' }, scale: { duration: 3, repeat: Infinity } }}
        >
          <Sparkles className="w-6 h-6" />
        </motion.div>
      </motion.div>
    </div>
  )
}
