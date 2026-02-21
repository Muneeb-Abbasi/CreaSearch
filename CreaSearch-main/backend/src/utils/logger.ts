/**
 * Secure Logger — structured logging utility for production.
 * 
 * Features:
 * - Redacts sensitive fields (passwords, tokens, API keys, etc.)
 * - Structured JSON output in production, human-readable in dev
 * - Log levels: debug, info, warn, error
 * - Context tagging via prefix (e.g. "[Email]", "[Auth]")
 */

const LOG_LEVEL_MAP: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LOG_LEVEL = LOG_LEVEL_MAP[process.env.LOG_LEVEL || 'info'] ?? 1;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Fields to redact from logged objects
const SENSITIVE_KEYS = new Set([
  'password', 'secret', 'token', 'api_key', 'apikey', 'api_secret',
  'authorization', 'cookie', 'session', 'private_key', 'access_token',
  'refresh_token', 'supabase_service_role_key', 'resend_api_key',
  'credit_card', 'ssn', 'cvv',
]);

function redactValue(key: string, value: unknown): unknown {
  if (typeof key === 'string' && SENSITIVE_KEYS.has(key.toLowerCase())) {
    return '[REDACTED]';
  }
  return value;
}

function redactObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item));
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof value === 'object' && value !== null) {
      redacted[key] = redactValue(key, redactObject(value));
    } else {
      redacted[key] = redactValue(key, value);
    }
  }
  return redacted;
}

function formatArgs(args: unknown[]): unknown[] {
  return args.map(arg => {
    if (typeof arg === 'object' && arg !== null && !(arg instanceof Error)) {
      return redactObject(arg);
    }
    return arg;
  });
}

function shouldLog(level: string): boolean {
  return (LOG_LEVEL_MAP[level] ?? 1) >= CURRENT_LOG_LEVEL;
}

function createLogEntry(level: string, prefix: string, args: unknown[]) {
  const sanitizedArgs = formatArgs(args);

  if (IS_PRODUCTION) {
    // JSON structured logs for production (better for log aggregators)
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      prefix,
      message: sanitizedArgs.map(a =>
        typeof a === 'string' ? a : JSON.stringify(a)
      ).join(' '),
    };
    return JSON.stringify(entry);
  }

  // Human-readable in development
  return sanitizedArgs;
}

export const logger = {
  debug(prefix: string, ...args: unknown[]) {
    if (!shouldLog('debug')) return;
    const output = createLogEntry('debug', prefix, args);
    if (IS_PRODUCTION) {
      console.log(output);
    } else {
      console.log(`[DEBUG]${prefix}`, ...formatArgs(args));
    }
  },

  info(prefix: string, ...args: unknown[]) {
    if (!shouldLog('info')) return;
    const output = createLogEntry('info', prefix, args);
    if (IS_PRODUCTION) {
      console.log(output);
    } else {
      console.log(`[INFO]${prefix}`, ...formatArgs(args));
    }
  },

  warn(prefix: string, ...args: unknown[]) {
    if (!shouldLog('warn')) return;
    const output = createLogEntry('warn', prefix, args);
    if (IS_PRODUCTION) {
      console.warn(output);
    } else {
      console.warn(`[WARN]${prefix}`, ...formatArgs(args));
    }
  },

  error(prefix: string, ...args: unknown[]) {
    if (!shouldLog('error')) return;
    const output = createLogEntry('error', prefix, args);
    if (IS_PRODUCTION) {
      console.error(output);
    } else {
      console.error(`[ERROR]${prefix}`, ...formatArgs(args));
    }
  },
};
