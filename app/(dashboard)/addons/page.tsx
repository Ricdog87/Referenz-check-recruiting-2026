'use client'

import { useState } from 'react'
import { ADDONS, ADDON_CATEGORIES, formatEuro, type Addon, type AddonSku } from '@/lib/addons'
import { useToast } from '@/components/Toaster'
import {
  ShoppingBag, Sparkles, CheckCircle2, Loader2, ArrowRight,
  BadgeCheck, Zap, Package, Mic, Phone, Layers, Upload,
} from 'lucide-react'

const CATEGORY_ICONS = {
  CHECK: Phone,
  INTERVIEW: Mic,
  SPEED: Zap,
  BULK: Upload,
}

const COLOR_CLASSES = {
  brand: {
    badge: 'bg-brand-50 text-brand-700 border-brand-200',
    icon: 'bg-brand-50 text-brand-600',
    ring: 'ring-brand-400',
    btn: 'bg-brand-600 hover:bg-brand-700 text-white',
    dot: 'bg-brand-500',
  },
  violet: {
    badge: 'bg-violet/10 text-violet border-violet/20',
    icon: 'bg-violet/10 text-violet',
    ring: 'ring-violet',
    btn: 'bg-violet hover:bg-violet/90 text-white',
    dot: 'bg-violet',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'bg-amber-50 text-amber-600',
    ring: 'ring-amber-400',
    btn: 'bg-amber-500 hover:bg-amber-600 text-white',
    dot: 'bg-amber-500',
  },
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'bg-emerald-50 text-emerald-600',
    ring: 'ring-emerald-400',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    dot: 'bg-emerald-500',
  },
  cyan: {
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: 'bg-cyan-50 text-cyan-600',
    ring: 'ring-cyan-400',
    btn: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    dot: 'bg-cyan-500',
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'bg-rose-50 text-rose-600',
    ring: 'ring-rose-400',
    btn: 'bg-rose-600 hover:bg-rose-700 text-white',
    dot: 'bg-rose-500',
  },
}

export default function AddonsPage() {
  const { toast } = useToast()
  const [activeCategory, setActiveCategory] = useState<string>('ALL')
  const [loading, setLoading] = useState<AddonSku | null>(null)
  const [success, setSuccess] = useState<AddonSku | null>(null)

  const categories = ['ALL', ...Object.keys(ADDON_CATEGORIES)] as const
  const filtered = activeCategory === 'ALL'
    ? ADDONS
    : ADDONS.filter((a) => a.category === activeCategory)

  async function bookAddon(addon: Addon) {
    if (loading) return
    setLoading(addon.sku)
    try {
      const res = await fetch('/api/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: addon.sku }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Fehler beim Buchen')
      setSuccess(addon.sku)
      toast({
        variant: 'success',
        title: `${addon.name} gebucht`,
        description: `${formatEuro(addon.price * addon.quantity)} · Wir aktivieren das Add-on innerhalb von 24h.`,
      })
      setTimeout(() => setSuccess(null), 4000)
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Buchung fehlgeschlagen',
        description: e.message,
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-5 h-5 text-brand-600" />
            <h1 className="text-2xl font-black text-text-primary tracking-tight">Add-ons</h1>
          </div>
          <p className="text-sm text-text-secondary max-w-xl">
            Erweitern Sie Ihr Paket mit einzeln buchbaren Leistungen — sofort aktiv, transparent berechnet.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary bg-bg-secondary border border-border rounded-xl px-3 py-2">
          <BadgeCheck className="w-4 h-4 text-emerald-600" />
          DSGVO-konform · Server Deutschland
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const meta = cat === 'ALL'
            ? { label: 'Alle', desc: '' }
            : ADDON_CATEGORIES[cat as keyof typeof ADDON_CATEGORIES]
          const CatIcon = cat !== 'ALL' ? CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] : Package
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white border-brand-600 shadow-card'
                  : 'bg-white text-text-secondary border-border hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              <CatIcon className="w-3.5 h-3.5" />
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* Add-on cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((addon) => {
          const cls = COLOR_CLASSES[addon.color]
          const Icon = addon.icon
          const isLoading = loading === addon.sku
          const isSuccess = success === addon.sku

          return (
            <div
              key={addon.sku}
              className={`card-lg flex flex-col shadow-card transition-all hover:shadow-card-lg relative ${
                addon.highlight ? `ring-2 ${cls.ring}` : ''
              }`}
            >
              {/* Badges */}
              {addon.badge && (
                <div className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls.badge}`}>
                  {addon.badge}
                </div>
              )}

              {/* Icon + name */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cls.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-text-primary leading-snug">{addon.name}</div>
                  <div className="text-[11px] text-text-muted">{addon.tagline}</div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-3">
                <span className="text-2xl font-black text-text-primary">{formatEuro(addon.price)}</span>
                <span className="text-xs text-text-muted ml-1">/ {addon.unit}</span>
                {addon.fromPrice && (
                  <span className="ml-2 text-xs line-through text-text-muted">{formatEuro(addon.fromPrice)}</span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-text-secondary leading-relaxed mb-4">{addon.description}</p>

              {/* Features */}
              <ul className="space-y-1.5 mb-5 flex-1">
                {addon.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                    <span className={`mt-0.5 w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center ${cls.icon}`}>
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => bookAddon(addon)}
                disabled={isLoading || isSuccess}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${cls.btn}`}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Wird gebucht…</>
                ) : isSuccess ? (
                  <><CheckCircle2 className="w-4 h-4" /> Gebucht! Wir melden uns.</>
                ) : (
                  <>{addon.cta} <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Bottom info */}
      <div className="card-md bg-bg-secondary border-dashed">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-brand-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-text-primary mb-0.5">Mehr Volumen oder individuelle Anforderungen?</div>
            <p className="text-xs text-text-secondary">
              Für Unternehmenskunden mit hohem Volumen bieten wir individuelle Rahmenverträge.
              Sprechen Sie uns an — wir erstellen Ihnen in 24 h ein Angebot.
            </p>
          </div>
          <a
            href="mailto:hello@candiq.de?subject=Add-on-Anfrage"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors whitespace-nowrap"
          >
            Vertrieb kontaktieren <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
