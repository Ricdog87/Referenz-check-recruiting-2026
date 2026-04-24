import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const CANDIDATE_STATUS = {
  PENDING: { label: 'Ausstehend', color: 'text-text-secondary bg-bg-card' },
  IN_REVIEW: { label: 'In Prüfung', color: 'text-status-info bg-status-infoBg' },
  COMPLETED: { label: 'Abgeschlossen', color: 'text-status-success bg-status-successBg' },
  REJECTED: { label: 'Abgelehnt', color: 'text-status-error bg-status-errorBg' },
} as const

export const CHECK_STATUS = {
  OPEN: { label: 'Offen', color: 'text-text-secondary bg-bg-card' },
  IN_PROGRESS: { label: 'In Bearbeitung', color: 'text-status-warning bg-status-warningBg' },
  COMPLETED: { label: 'Abgeschlossen', color: 'text-status-success bg-status-successBg' },
  FAILED: { label: 'Fehlgeschlagen', color: 'text-status-error bg-status-errorBg' },
} as const

export const CHECK_RESULT = {
  VERIFIED: { label: 'Verifiziert', color: 'text-status-success bg-status-successBg' },
  DISCREPANCY_FOUND: { label: 'Unstimmigkeit', color: 'text-status-error bg-status-errorBg' },
  UNREACHABLE: { label: 'Nicht erreichbar', color: 'text-status-warning bg-status-warningBg' },
  DECLINED: { label: 'Auskunft verweigert', color: 'text-text-secondary bg-bg-card' },
} as const

export type CandidateStatus = keyof typeof CANDIDATE_STATUS
export type CheckStatus = keyof typeof CHECK_STATUS
export type CheckResult = keyof typeof CHECK_RESULT
