/**
 * G23 — ElevenLabs-Agent-ID: ENV-konfigurierbar + Graceful-Degradation.
 */
import { describe, it, expect } from 'vitest'
import { resolveAgentId, DEFAULT_ELEVENLABS_AGENT_ID } from '@/lib/voice-config'

describe('resolveAgentId', () => {
  it('ENV nicht gesetzt (undefined) → dokumentierter Default', () => {
    expect(resolveAgentId(undefined)).toBe(DEFAULT_ELEVENLABS_AGENT_ID)
  })

  it('ENV gesetzt → getrimmter Wert gewinnt', () => {
    expect(resolveAgentId('  agent_custom_123  ')).toBe('agent_custom_123')
  })

  it('ENV explizit leer → "" (bewusstes Abschalten, Aufrufer degradiert)', () => {
    expect(resolveAgentId('')).toBe('')
    expect(resolveAgentId('   ')).toBe('')
  })
})
