import Link from 'next/link'
import {
  ScrollText, ArrowRight, UserPlus, Phone, ShieldCheck, ShoppingBag,
  FileText, Edit3, Trash2, Download, LogIn, AlertCircle,
} from 'lucide-react'

const ACTION_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  CANDIDATE_CREATED: { label: 'Kandidat angelegt', icon: UserPlus, color: 'text-brand-600 bg-brand-50' },
  CANDIDATE_UPDATED: { label: 'Kandidat aktualisiert', icon: Edit3, color: 'text-brand-600 bg-brand-50' },
  CANDIDATE_DELETED: { label: 'Kandidat gelöscht', icon: Trash2, color: 'text-rose-600 bg-rose-50' },
  CHECK_CREATED: { label: 'Prüfung angelegt', icon: Phone, color: 'text-violet bg-violet/10' },
  CHECK_UPDATED: { label: 'Prüfung aktualisiert', icon: Phone, color: 'text-violet bg-violet/10' },
  CHECK_COMPLETED: { label: 'Prüfung abgeschlossen', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
  ADDON_BOOKED: { label: 'Add-on gebucht', icon: ShoppingBag, color: 'text-amber-600 bg-amber-50' },
  REGISTRATION: { label: 'Registrierung', icon: UserPlus, color: 'text-emerald-600 bg-emerald-50' },
  LOGIN: { label: 'Anmeldung', icon: LogIn, color: 'text-text-muted bg-bg-secondary' },
  GDPR_EXPORT: { label: 'DSGVO-Export', icon: Download, color: 'text-violet bg-violet/10' },
  GDPR_DELETE: { label: 'DSGVO-Löschung', icon: Trash2, color: 'text-rose-600 bg-rose-50' },
  CREATE: { label: 'Kandidat angelegt', icon: UserPlus, color: 'text-brand-600 bg-brand-50' },
  UPDATE: { label: 'Aktualisiert', icon: Edit3, color: 'text-brand-600 bg-brand-50' },
  DELETE: { label: 'Gelöscht', icon: Trash2, color: 'text-rose-600 bg-rose-50' },
  EMAIL_SEND: { label: 'E-Mail versendet', icon: FileText, color: 'text-violet bg-violet/10' },
  CONSENT_INVITE_SENT: { label: 'Einwilligungs-Einladung versendet', icon: FileText, color: 'text-brand-600 bg-brand-50' },
  CONSENT_ACCEPTED: { label: 'Einwilligung erteilt', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
  CONSENT_REVOKED: { label: 'Einwilligung widerrufen', icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
  CANDIDATE_DOCUMENT_UPLOAD: { label: 'Dokument hochgeladen', icon: FileText, color: 'text-brand-600 bg-brand-50' },
  CANDIDATE_DOCUMENT_DELETE: { label: 'Dokument entfernt', icon: Trash2, color: 'text-rose-600 bg-rose-50' },
  PASSWORD_RESET_REQUEST: { label: 'Passwort-Reset angefordert', icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
  PASSWORD_RESET_COMPLETED: { label: 'Passwort zurückgesetzt', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
}

function humanizeAction(action: string): string {
  return action
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function humanizeDetails(details: string | null): string | null {
  if (!details) return null
  // Schöner: key=value · key=value → 'Empfänger: x · Provider: y'
  const map: Record<string, string> = {
    to: 'Empfänger',
    from: 'Absender',
    provider: 'Provider',
    expires: 'Gültig bis',
    subject: 'Betreff',
    category: 'Kategorie',
    refereesCount: 'Referenzgeber',
    candidate: 'Kandidat',
    type: 'Typ',
    mime: 'Format',
    size: 'Größe',
    version: 'Version',
    ua: 'Browser',
    previousStatus: 'Vorheriger Status',
    originalName: 'Datei',
  }
  return details
    .split(/\s·\s|\s+/)
    .map((part) => {
      const [k, ...rest] = part.split('=')
      if (rest.length === 0) return part
      const v = rest.join('=')
      const label = map[k] ?? k
      // Verkürze sehr lange Werte (Tokens etc.)
      const shortV = v.length > 60 ? v.slice(0, 50) + '…' : v
      return `${label}: ${shortV}`
    })
    .join(' · ')
}

function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'gerade eben'
  if (min < 60) return `vor ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `vor ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `vor ${d} Tagen`
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

export function ActivityFeed({
  events,
}: {
  events: { id: string; action: string; entity: string; details: string | null; createdAt: Date }[]
}) {
  return (
    <div className="card-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="section-title flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-brand-600" />
            Aktivität
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">Audit-Trail (DSGVO Art. 30)</p>
        </div>
        <Link href="/audit" className="text-xs text-brand-700 hover:text-brand-800 font-semibold flex items-center gap-1">
          Alle Logs <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-xs text-text-muted">
          Noch keine protokollierten Aktivitäten.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {events.map((e) => {
            const meta = ACTION_META[e.action] ?? { label: humanizeAction(e.action), icon: FileText, color: 'text-text-secondary bg-bg-secondary' }
            const Icon = meta.icon
            return (
              <li key={e.id} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-bg-secondary transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-text-primary truncate">{meta.label}</div>
                  {e.details && (
                    <div className="text-[10px] text-text-muted truncate" title={e.details}>{humanizeDetails(e.details)}</div>
                  )}
                </div>
                <div className="text-[10px] text-text-muted whitespace-nowrap mt-1">
                  {relativeTime(e.createdAt)}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
