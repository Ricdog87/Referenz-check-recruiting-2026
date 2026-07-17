import { del, list } from '@vercel/blob'
import { logger } from '@/lib/logger'

/**
 * Zentrale, defensive Löschung von Vercel-Blob-Objekten für die
 * DSGVO-Löschpfade (Auto-Cleanup-Cron + Art.-17-User-Löschung).
 *
 * WICHTIG (R2): DB-Zeilen zu löschen entfernt NICHT die Datei-Objekte im
 * Blob-Store. Ohne diese Helfer bleiben CV-/Zeugnis-Dateien und Report-PDFs
 * nach jeder „Löschung" dauerhaft liegen — das Kern-DSGVO-Versprechen wäre
 * für die Dateien selbst unwahr.
 *
 * Best-effort mit Zählung: Ein einzelner fehlgeschlagener Löschversuch
 * (Datei bereits weg, transienter Storage-Fehler) darf den umgebenden
 * Lösch-/Cron-Flow nicht abbrechen — aber jeder Fehlschlag wird geloggt,
 * und der Aufrufer bekommt die Fehlerzahl für den Audit-Beleg zurück.
 */

const BLOB_CONFIGURED = Boolean(process.env.BLOB_READ_WRITE_TOKEN)

/** Löscht eine Liste konkreter Blob-URLs. Leere/duplizierte werden gefiltert. */
export async function deleteBlobUrls(urls: (string | null | undefined)[]): Promise<{
  deleted: number
  failed: number
}> {
  const clean = Array.from(
    new Set(urls.filter((u): u is string => typeof u === 'string' && u.startsWith('http'))),
  )
  if (clean.length === 0) return { deleted: 0, failed: 0 }
  if (!BLOB_CONFIGURED) {
    logger.warn('blob_cleanup_no_token', { wouldDelete: clean.length })
    return { deleted: 0, failed: clean.length }
  }

  let deleted = 0
  let failed = 0
  // Einzeln löschen statt Batch, damit ein einzelner Fehler die übrigen
  // nicht mitreißt (del([...]) ist all-or-nothing bei Netzwerkfehlern).
  for (const url of clean) {
    try {
      await del(url)
      deleted++
    } catch (err) {
      failed++
      logger.warn('blob_cleanup_del_failed', { url: redactBlobUrl(url), err: String(err) })
    }
  }
  return { deleted, failed }
}

/**
 * Löscht alle Blob-Objekte unter einem Prefix (z. B. `reports/<checkId>/`).
 * Für Report-PDFs, die NICHT in der DB getrackt sind und nur per Pfad
 * auffindbar sind.
 */
export async function deleteBlobsByPrefix(prefix: string): Promise<{
  deleted: number
  failed: number
}> {
  if (!BLOB_CONFIGURED) {
    logger.warn('blob_cleanup_no_token', { prefix })
    return { deleted: 0, failed: 0 }
  }
  try {
    const { blobs } = await list({ prefix })
    return await deleteBlobUrls(blobs.map((b) => b.url))
  } catch (err) {
    logger.warn('blob_cleanup_list_failed', { prefix, err: String(err) })
    return { deleted: 0, failed: 0 }
  }
}

/** Entfernt den Datei-Teil aus der Blob-URL fürs Logging (kein PII-Leak). */
function redactBlobUrl(url: string): string {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/')
    return `${u.host}/…/${parts[parts.length - 1] ?? ''}`
  } catch {
    return '[unparseable-url]'
  }
}
