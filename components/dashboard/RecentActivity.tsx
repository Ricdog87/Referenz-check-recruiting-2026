import Link from 'next/link'
import { ScrollText, ArrowRight, UserPlus, Phone, ShieldCheck, ShoppingBag, FileText, Edit3, Trash2, Download, LogIn } from 'lucide-react'

const ACTION_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; dot: string; badge: string }> = {
  CANDIDATE_CREATED: { label: 'Kandidat angelegt',      icon: UserPlus,    dot: 'bg-indigo-500',  badge: 'text-indigo-700 bg-indigo-50' },
  CANDIDATE_UPDATED: { label: 'Kandidat aktualisiert',  icon: Edit3,       dot: 'bg-indigo-400',  badge: 'text-indigo-700 bg-indigo-50' },
  CANDIDATE_DELETED: { label: 'Kandidat gelöscht',      icon: Trash2,      dot: 'bg-rose-500',    badge: 'text-rose-700 bg-rose-50' },
  CHECK_CREATED:     { label: 'Prüfung gestartet',      icon: Phone,       dot: 'bg-violet-500',  badge: 'text-violet-700 bg-violet-50' },
  CHECK_UPDATED:     { label: 'Prüfung aktualisiert',   icon: Phone,       dot: 'bg-violet-400',  badge: 'text-violet-700 bg-violet-50' },
  CHECK_COMPLETED:   { label: 'Prüfung abgeschlossen',  icon: ShieldCheck, dot: 'bg-emerald-500', badge: 'text-emerald-700 bg-emerald-50' },
  ADDON_BOOKED:      { label: 'Add-on gebucht',         icon: ShoppingBag, dot: 'bg-amber-500',   badge: 'text-amber-700 bg-amber-50' },
  REGISTRATION:      { label: 'Registrierung',          icon: UserPlus,    dot: 'bg-emerald-500', badge: 'text-emerald-700 bg-emerald-50' },
  LOGIN:             { label: 'Anmeldung',              icon: LogIn,       dot: 'bg-slate-300',   badge: 'text-slate-600 bg-slate-50' },
  GDPR_EXPORT:       { label: 'DSGVO-Export',           icon: Download,    dot: 'bg-violet-500',  badge: 'text-violet-700 bg-violet-50' },
  GDPR_DELETE:       { label: 'DSGVO-Löschung',         icon: Trash2,      dot: 'bg-rose-500',    badge: 'text-rose-700 bg-rose-50' },
}

function relTime(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000)
  if (m < 1) return 'gerade eben'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h`
  const day = Math.floor(h / 24)
  if (day < 7) return `${day}d`
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

export function RecentActivity({ events }: { events: { id: string; action: string; entity: string; details: string | null; createdAt: Date }[] }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-slate-400" />
            Aktivität
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Audit-Trail · DSGVO Art. 30</p>
        </div>
        <Link href="/audit" className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          Alle <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-[11px] text-slate-400">Noch keine Aktivitäten</div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[13px] top-2 bottom-2 w-px bg-slate-100" />
          <ul className="space-y-1">
            {events.map((e) => {
              const meta = ACTION_META[e.action] ?? { label: e.action, icon: FileText, dot: 'bg-slate-300', badge: 'text-slate-600 bg-slate-50' }
              const Icon = meta.icon
              return (
                <li key={e.id} className="flex items-start gap-3 py-1.5 group hover:bg-slate-50 rounded-lg px-1 transition-colors">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div className={`w-[26px] h-[26px] rounded-full border-2 border-white flex items-center justify-center ${meta.badge}`} style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.06)' }}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${meta.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-700">{meta.label}</div>
                    {e.details && <div className="text-[10px] text-slate-400 truncate mt-0.5">{e.details}</div>}
                  </div>
                  <div className="text-[10px] text-slate-300 whitespace-nowrap font-medium mt-0.5">{relTime(e.createdAt)}</div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
