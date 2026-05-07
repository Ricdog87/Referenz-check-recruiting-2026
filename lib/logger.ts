/**
 * Minimal structured logger. Emits single-line JSON in production so Vercel
 * log drains can parse fields; falls back to readable output in development.
 *
 * Use logger.warn/error for handled exceptions. Never logs full stack traces
 * to client-visible code paths.
 */

type Level = 'info' | 'warn' | 'error'

interface LogPayload {
  [key: string]: unknown
}

const isProd = process.env.NODE_ENV === 'production'

function serializeError(err: unknown): LogPayload {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      ...(isProd ? {} : { stack: err.stack }),
      ...((err as any).code ? { code: (err as any).code } : {}),
    }
  }
  if (typeof err === 'object' && err !== null) {
    return err as LogPayload
  }
  return { value: String(err) }
}

function emit(level: Level, event: string, data?: unknown) {
  const payload: LogPayload = {
    level,
    event,
    timestamp: new Date().toISOString(),
  }

  if (data !== undefined) {
    if (data instanceof Error || (typeof data === 'object' && data !== null && 'message' in (data as any))) {
      payload.error = serializeError(data)
    } else if (typeof data === 'object') {
      Object.assign(payload, data)
    } else {
      payload.detail = data
    }
  }

  const line = isProd ? JSON.stringify(payload) : `[${level}] ${event} ${data ? JSON.stringify(payload) : ''}`

  if (level === 'error') {
    // eslint-disable-next-line no-console
    console.error(line)
  } else if (level === 'warn') {
    // eslint-disable-next-line no-console
    console.warn(line)
  } else {
    // eslint-disable-next-line no-console
    console.log(line)
  }
}

export const logger = {
  info: (event: string, data?: unknown) => emit('info', event, data),
  warn: (event: string, data?: unknown) => emit('warn', event, data),
  error: (event: string, data?: unknown) => emit('error', event, data),
}
