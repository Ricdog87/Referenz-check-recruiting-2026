'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/components/Toaster'
import {
  ScrollText, Filter, Download, Search, Clock, ShieldCheck,
  UserPlus, FileText, Phone, ShoppingBag, Trash2, Edit3, LogIn, AlertCircle,
} from 'lucide-react'

type AuditEntry = {
  id: string
  action: string
  entity: string
  entityId: string | null
  details: string | null
  ip: string | null
  createdAt: string
}

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

function getActionMeta(action: string) {
  return ACTION_META[action] ?? { label: humanizeAction(action), icon: FileText, color: 'text-text-secondary bg-bg-secondary' }
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export function AuditTrailClient({
  logs,
  actions,
  entities,
  active,
}: {
  logs: AuditEntry[]
  actions: { value: string; count: number }[]
  entities: { value: string; count: number }[]
  active: { action: string; entity: string }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [search, setSearch] = useState('')

  const filtered = search
    ? logs.filter((l) =>
        [l.action, l.entity, l.entityId, l.details, l.ip]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(search.toLowerCase()))
      )
    : logs

  function setFilter(key: 'action' | 'entity', value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/audit?${params.toString()}`)
  }

  function exportCsv() {
    if (filtered.length === 0) {
      toast({ variant: 'info', title: 'Keine Einträge zum Exportieren' })
      return
    }
    const header = ['Zeitpunkt', 'Aktion', 'Entität', 'Entity-ID', 'Details', 'IP'].join(';')
    const rows = filtered.map((l) =>
      [
        formatDateTime(l.createdAt),
        l.action,
        l.entity,
        l.entityId ?? '',
        (l.details ?? '').replace(/[;\n\r]/g, ' '),
        l.ip ?? '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')
    )
    const csv = '﻿' + [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `candiq-audit-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      variant: 'success',
      title: 'CSV exportiert',
      description: `${filtered.length} Einträge · DSGVO-konform protokolliert`,
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="card-md p-3 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            placeholder="Aktion, Entität, IP, Details…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-full bg-bg-secondary border border-border focus:bg-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/15 transition-all"
          />
        </div>

        <select
          value={active.action}
          onChange={(e) => setFilter('action', e.target.value)}
          className="text-xs px-3 py-2 rounded-full bg-bg-secondary border border-border focus:outline-none"
        >
          <option value="">Alle Aktionen ({actions.reduce((a, b) => a + b.count, 0)})</option>
          {actions.map((a) => (
            <option key={a.value} value={a.value}>
              {getActionMeta(a.value).label} ({a.count})
            </option>
          ))}
        </select>

        <select
          value={active.entity}
          onChange={(e) => setFilter('entity', e.target.value)}
          className="text-xs px-3 py-2 rounded-full bg-bg-secondary border border-border focus:outline-none"
        >
          <option value="">Alle Entitäten</option>
          {entities.map((e) => (
            <option key={e.value} value={e.value}>
              {e.value} ({e.count})
            </option>
          ))}
        </select>

        <button onClick={exportCsv} className="btn-secondary text-xs">
          <Download className="w-3.5 h-3.5" />CSV-Export
        </button>
      </div>

      {/* Compliance banner */}
      <div className="card-md bg-brand-50/40 border-brand-200 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-white border border-brand-200 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
        </div>
        <div className="flex-1 text-xs text-text-secondary leading-relaxed">
          <span className="font-bold text-text-primary">DSGVO Art. 30 — Verzeichnis von Verarbeitungstätigkeiten.</span>{' '}
          Alle Aktionen werden mit Zeitstempel, IP und User-ID protokolliert.
          Die letzten 200 Einträge sind hier sichtbar — vollständiger Export per CSV.
        </div>
      </div>

      {/* Log table */}
      {filtered.length === 0 ? (
        <div className="card-lg text-center py-16">
          <div className="w-12 h-12 rounded-2xl bg-bg-secondary mx-auto mb-3 flex items-center justify-center">
            <ScrollText className="w-5 h-5 text-text-muted" />
          </div>
          <div className="text-text-primary font-semibold mb-1">Keine Audit-Einträge</div>
          <div className="text-text-muted text-sm">
            {search || active.action || active.entity
              ? 'Probieren Sie andere Filter.'
              : 'Aktionen werden hier protokolliert sobald Sie Kandidaten anlegen oder Prüfungen starten.'}
          </div>
        </div>
      ) : (
        <div className="card-md p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-secondary">
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest">Zeitpunkt</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest">Aktion</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest hidden md:table-cell">Entität</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest hidden lg:table-cell">Details</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest hidden lg:table-cell">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((log) => {
                  const meta = getActionMeta(log.action)
                  const Icon = meta.icon
                  return (
                    <tr key={log.id} className="hover:bg-bg-secondary/40 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-text-secondary font-mono whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="inline-flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-text-primary">{meta.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        <div className="text-xs text-text-secondary">{log.entity}</div>
                        {log.entityId && (
                          <div className="text-[10px] font-mono text-text-muted truncate max-w-[120px]">{log.entityId}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-text-secondary max-w-md truncate">
                        {log.details}
                      </td>
                      <td className="px-4 py-2.5 hidden lg:table-cell text-[11px] font-mono text-text-muted">
                        {log.ip}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {logs.length === 200 && (
            <div className="px-4 py-2.5 bg-bg-secondary border-t border-border text-[11px] text-text-muted text-center">
              <Clock className="w-3 h-3 inline mr-1" />
              Es werden die letzten 200 Einträge angezeigt. Vollständiger Export per CSV.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
