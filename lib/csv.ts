/**
 * Sehr leichtgewichtiger CSV-Parser für Kandidaten-Bulk-Import.
 *
 * Bewusst kein papaparse/csv-parse — der Use-Case ist ≤ 500 Zeilen, einfacher
 * Aufbau (firstName,lastName,...). Keine zusätzliche Dependency, kein Build-
 * Bloat, voll testbar.
 *
 * Unterstützt:
 *  - Komma- und Semikolon-getrennt (auto-detect über erste Header-Zeile)
 *  - In-String-Quoting mit "..." inkl. "" als Escape für Quote-in-Field
 *  - CRLF / LF
 *  - UTF-8 BOM
 */

export type CsvRow = Record<string, string>

export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  // BOM entfernen
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)

  // CRLF → LF
  text = text.replace(/\r\n?/g, '\n')

  // Erste nicht-leere Zeile bestimmt das Trennzeichen
  const firstLineEnd = text.indexOf('\n')
  const firstLine = firstLineEnd === -1 ? text : text.slice(0, firstLineEnd)
  const semis = (firstLine.match(/;/g) ?? []).length
  const commas = (firstLine.match(/,/g) ?? []).length
  const delimiter = semis > commas ? ';' : ','

  const lines = parseLines(text, delimiter)
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = (lines[0] ?? []).map((h) => h.trim())
  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i] ?? []
    if (cells.every((c) => c === '')) continue // leere Zeile
    const row: CsvRow = {}
    headers.forEach((h, idx) => {
      row[h] = (cells[idx] ?? '').trim()
    })
    rows.push(row)
  }

  return { headers, rows }
}

function parseLines(text: string, delimiter: string): string[][] {
  const lines: string[][] = []
  let current: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          // Escaped quote inside string
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === delimiter) {
        current.push(cell)
        cell = ''
      } else if (ch === '\n') {
        current.push(cell)
        lines.push(current)
        current = []
        cell = ''
      } else {
        cell += ch
      }
    }
  }
  // letzte Zeile
  if (cell !== '' || current.length > 0) {
    current.push(cell)
    lines.push(current)
  }
  return lines
}

/**
 * Ordnet Spalten-Header auf Kandidaten-Felder. Tolerant gegen Schreibweisen.
 */
export function mapHeaderToField(header: string): keyof CandidateInput | null {
  const norm = header.toLowerCase().trim().replace(/[\s_-]/g, '')
  const map: Record<string, keyof CandidateInput> = {
    vorname: 'firstName', firstname: 'firstName', 'first name': 'firstName', name: 'firstName',
    nachname: 'lastName', lastname: 'lastName', 'last name': 'lastName', surname: 'lastName',
    email: 'email', 'email-adresse': 'email', emailadresse: 'email', mail: 'email',
    telefon: 'phone', phone: 'phone', tel: 'phone', mobile: 'phone', mobil: 'phone',
    position: 'position', stelle: 'position', stellenbezeichnung: 'position', jobtitle: 'position', titel: 'position',
    abteilung: 'department', department: 'department', team: 'department', bereich: 'department',
    notizen: 'notes', notes: 'notes', anmerkung: 'notes', anmerkungen: 'notes', kommentar: 'notes',
  }
  return map[norm] ?? null
}

export type CandidateInput = {
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  notes: string
}

export function rowToCandidate(row: CsvRow, headers: string[]): { data: CandidateInput; error?: string } {
  const data: CandidateInput = { firstName: '', lastName: '', email: '', phone: '', position: '', department: '', notes: '' }
  for (const header of headers) {
    const field = mapHeaderToField(header)
    if (!field) continue
    data[field] = (row[header] ?? '').toString().trim()
  }
  if (!data.firstName || !data.lastName || !data.position) {
    return { data, error: 'Vorname, Nachname und Position sind Pflichtfelder.' }
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) {
    return { data, error: `E-Mail ungültig: ${data.email}` }
  }
  return { data }
}
