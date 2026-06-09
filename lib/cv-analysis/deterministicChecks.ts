import type { CandidateInput, ClaimFlag, FlagSeverity, Station } from './types'

type DateRange = {
  label: string
  start: Date
  end: Date
  original: Station
}

const SENIOR_TITLES = /\b(head|director|vp|vice president|chief|cxo|lead|principal|senior manager)\b/i
const ENTRY_TITLES = /\b(intern|praktikant|trainee|working student|werkstudent|junior)\b/i

function severityForMonths(months: number): FlagSeverity {
  if (months >= 12) return 'high'
  if (months >= 6) return 'medium'
  return 'low'
}

export function parseCvDate(value: string, now = new Date()): Date | null {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  if (['present', 'current', 'heute', 'aktuell', 'now'].includes(normalized)) return new Date(now.getFullYear(), now.getMonth(), 1)

  const monthYear = normalized.match(/^(\d{4})[-/.](\d{1,2})$/)
  if (monthYear) {
    const year = Number(monthYear[1])
    const month = Number(monthYear[2]) - 1
    if (month >= 0 && month <= 11) return new Date(year, month, 1)
  }

  const yearOnly = normalized.match(/^(\d{4})$/)
  if (yearOnly) return new Date(Number(yearOnly[1]), 0, 1)

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), 1)
}

function monthDiff(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
}

function addFlag(flags: ClaimFlag[], flag: ClaimFlag) {
  flags.push(flag)
}

export function runDeterministicChecks(input: CandidateInput, now = new Date()): ClaimFlag[] {
  const flags: ClaimFlag[] = []
  const ranges: DateRange[] = []

  for (const station of input.stations) {
    const start = parseCvDate(station.startDate, now)
    const end = parseCvDate(station.endDate, now)
    const label = `${station.title} bei ${station.company}`

    if (!start || !end) {
      addFlag(flags, {
        claim: label,
        type: 'timeline_date_parse',
        severity: 'medium',
        reason: `Start- oder Enddatum ist nicht eindeutig maschinenlesbar (${station.startDate}–${station.endDate}); im Referenz-Call konkret bestätigen lassen.`,
        source: 'deterministic',
      })
      continue
    }

    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    if (start > currentMonth || end > currentMonth) {
      addFlag(flags, {
        claim: label,
        type: 'timeline_future_date',
        severity: 'high',
        reason: `Der Zeitraum ${station.startDate}–${station.endDate} liegt ganz oder teilweise in der Zukunft und sollte belegt werden.`,
        source: 'deterministic',
      })
    }

    if (start > end) {
      addFlag(flags, {
        claim: label,
        type: 'timeline_impossible_range',
        severity: 'high',
        reason: `Das Startdatum ${station.startDate} liegt nach dem Enddatum ${station.endDate}.`,
        source: 'deterministic',
      })
      continue
    }

    const durationMonths = monthDiff(start, end) + 1
    if (durationMonths <= 2) {
      addFlag(flags, {
        claim: label,
        type: 'timeline_short_tenure',
        severity: 'low',
        reason: `Die Station dauert nur ${durationMonths} Monat(e); Aufgaben und Austrittsgrund priorisiert verifizieren.`,
        source: 'deterministic',
      })
    }

    ranges.push({ label, start, end, original: station })
  }

  const sorted = [...ranges].sort((a, b) => a.start.getTime() - b.start.getTime())
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]
    const overlapMonths = monthDiff(next.start, current.end) + 1
    if (overlapMonths > 0 && current.original.company.toLowerCase() !== next.original.company.toLowerCase()) {
      addFlag(flags, {
        claim: `${current.label} überschneidet sich mit ${next.label}`,
        type: 'timeline_overlap',
        severity: severityForMonths(overlapMonths),
        reason: `Die Stationen überschneiden sich um ca. ${overlapMonths} Monat(e); Beschäftigungsart und tatsächliche Arbeitslast prüfen.`,
        source: 'deterministic',
      })
    }

    const gapMonths = monthDiff(current.end, next.start) - 1
    if (gapMonths >= 6) {
      addFlag(flags, {
        claim: `Lücke zwischen ${current.label} und ${next.label}`,
        type: 'timeline_gap',
        severity: severityForMonths(gapMonths),
        reason: `Zwischen den Stationen liegt eine nicht erklärte Lücke von ca. ${gapMonths} Monat(en).`,
        source: 'deterministic',
      })
    }
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]
    const transitionMonths = monthDiff(current.end, next.start)
    if (ENTRY_TITLES.test(current.original.title) && SENIOR_TITLES.test(next.original.title) && transitionMonths <= 8) {
      addFlag(flags, {
        claim: `${current.original.title} → ${next.original.title}`,
        type: 'title_duration_plausibility',
        severity: 'high',
        reason: `Der Sprung von Einstiegs-/Praktikumsrolle zu Senior-/Leitungsrolle erfolgt innerhalb von ${Math.max(0, transitionMonths)} Monat(en); Verantwortungsumfang verifizieren.`,
        source: 'deterministic',
      })
    }
  }

  return flags
}
