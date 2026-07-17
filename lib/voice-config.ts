/**
 * Konfiguration der ElevenLabs-Voice-Demo (G23).
 *
 * Die Agent-ID war hart im Client-Component verdrahtet, ohne Fallback. Sie
 * ist zwar kein Secret (der Browser sendet sie ohnehin an ElevenLabs), soll
 * aber pro Umgebung konfigurierbar sein und bei Fehlen sauber degradieren
 * statt eine leere Session zu starten.
 *
 * Auflösung:
 *   - ENV `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` gesetzt → dieser Wert (getrimmt)
 *   - ENV nicht gesetzt → dokumentierter Default (Prod-Verhalten bleibt)
 *   - ENV explizit leer → '' → Aufrufer degradiert graceful (Demo aus)
 */

// Bestehende Prod-Agent-ID als Default — kein Verhaltensbruch ohne neue ENV.
export const DEFAULT_ELEVENLABS_AGENT_ID = 'agent_9601ktktemgwfk3tey407mkkxnc5'

export function resolveAgentId(
  raw: string | undefined = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
): string {
  // Nur `undefined` (ENV nicht gesetzt) fällt auf den Default zurück;
  // ein explizit gesetzter (auch leerer) Wert gewinnt → bewusstes Abschalten.
  if (raw === undefined) return DEFAULT_ELEVENLABS_AGENT_ID
  return raw.trim()
}
