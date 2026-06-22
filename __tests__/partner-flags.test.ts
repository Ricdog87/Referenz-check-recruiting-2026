/**
 * __tests__/partner-flags.test.ts
 *
 * Beweist:
 *   - isFlagEnabled() liest tolerant aus ENV
 *   - isPartnerProgramEnabled() gatet auf PARTNER_PROGRAM_ENABLED
 *   - Default ist immer false — Features sind „off until explicitly enabled"
 */

import { describe, it, expect, afterEach } from 'vitest'
import { isFlagEnabled, isPartnerProgramEnabled } from '@/lib/flags'

const TEST_KEY = 'PARTNER_TEST_FLAG_X1Y2'
const REAL_KEY = 'PARTNER_PROGRAM_ENABLED'

function withEnv(key: string, value: string | undefined, fn: () => void) {
  const before = process.env[key]
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
  try {
    fn()
  } finally {
    if (before === undefined) delete process.env[key]
    else process.env[key] = before
  }
}

describe('isFlagEnabled — toleranter Parser', () => {
  afterEach(() => {
    delete process.env[TEST_KEY]
  })

  it('returns false when env var is unset', () => {
    delete process.env[TEST_KEY]
    expect(isFlagEnabled(TEST_KEY)).toBe(false)
  })

  it('returns false on empty string', () => {
    withEnv(TEST_KEY, '', () => expect(isFlagEnabled(TEST_KEY)).toBe(false))
  })

  it('accepts "true" (case-insensitive)', () => {
    for (const v of ['true', 'TRUE', 'True', '  true  ']) {
      withEnv(TEST_KEY, v, () => expect(isFlagEnabled(TEST_KEY)).toBe(true))
    }
  })

  it('accepts "1", "yes", "on" as truthy', () => {
    for (const v of ['1', 'yes', 'YES', 'on', 'ON']) {
      withEnv(TEST_KEY, v, () => expect(isFlagEnabled(TEST_KEY)).toBe(true))
    }
  })

  it('rejects everything else as false', () => {
    for (const v of ['false', '0', 'no', 'off', 'maybe', 'enabled', 'tru', '2']) {
      withEnv(TEST_KEY, v, () => expect(isFlagEnabled(TEST_KEY)).toBe(false))
    }
  })
})

describe('isPartnerProgramEnabled — Master-Switch', () => {
  it('default is OFF when env var is unset', () => {
    withEnv(REAL_KEY, undefined, () => {
      expect(isPartnerProgramEnabled()).toBe(false)
    })
  })

  it('becomes ON only with explicit truthy value', () => {
    withEnv(REAL_KEY, 'true', () => expect(isPartnerProgramEnabled()).toBe(true))
    withEnv(REAL_KEY, '1', () => expect(isPartnerProgramEnabled()).toBe(true))
  })

  it('stays OFF on common falsy values', () => {
    for (const v of ['false', '0', 'no', '', 'disabled']) {
      withEnv(REAL_KEY, v, () => expect(isPartnerProgramEnabled()).toBe(false))
    }
  })
})
