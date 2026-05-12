/**
 * Centralized structured logger.
 *
 * Available as a Nuxt server auto-import — no explicit import needed in any
 * server-side file (API routes, services, repositories, middleware).
 *
 * In production  → JSON lines (compatible with DataDog, Logtail, Axiom, etc.)
 * In development → readable formatted lines with full stack traces
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

function write(level: LogLevel, message: string, context?: LogContext) {
  const isProd = process.env.NODE_ENV === 'production'
  const ts = new Date().toISOString()

  if (isProd) {
    const entry = { level, message, timestamp: ts, ...context }
    const out = JSON.stringify(entry)
    if (level === 'error') process.stderr.write(out + '\n')
    else process.stdout.write(out + '\n')
  } else {
    const tag = `[${ts}] [${level.toUpperCase().padEnd(5)}]`
    const ctx =
      context && Object.keys(context).length
        ? ' ' + JSON.stringify(context, null, 0)
        : ''
    const line = `${tag} ${message}${ctx}`
    if (level === 'error') console.error(line)
    else if (level === 'warn') console.warn(line)
    else console.log(line)
  }
}

/**
 * Extracts a serializable shape from any thrown value.
 * Keeps the first 8 stack frames — enough to find the origin, not so many
 * that log storage explodes.
 */
function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    const frames = error.stack
      ?.split('\n')
      .slice(1, 9)
      .map((l) => l.trim())
      .filter(Boolean)

    return {
      errorMessage: error.message,
      errorName: error.name,
      stack: frames,
    }
  }
  return { errorMessage: String(error ?? 'unknown') }
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    write('debug', message, context),

  info: (message: string, context?: LogContext) =>
    write('info', message, context),

  warn: (message: string, context?: LogContext) =>
    write('warn', message, context),

  /** Legacy single-argument error log — kept for backward compatibility. */
  error: (message: string, context?: LogContext) =>
    write('error', message, context),

  /**
   * Log a caught error with full stack trace.
   *
   * Use this instead of `logger.error` whenever you have an Error object:
   *   logger.logError('[POST /api/posts]', error, { userId })
   */
  logError: (label: string, error: unknown, context?: LogContext) =>
    write('error', label, { ...serializeError(error), ...context }),
}
