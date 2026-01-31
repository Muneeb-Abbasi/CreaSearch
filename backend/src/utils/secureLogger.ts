/**
 * Secure Logger Utility
 * Masks sensitive data in logs to prevent leaking PII and secrets
 */

// Patterns for sensitive data that should be masked
const SENSITIVE_PATTERNS = [
    { pattern: /password/i, key: 'password' },
    { pattern: /token/i, key: 'token' },
    { pattern: /secret/i, key: 'secret' },
    { pattern: /apikey/i, key: 'apiKey' },
    { pattern: /api_key/i, key: 'api_key' },
    { pattern: /authorization/i, key: 'authorization' },
    { pattern: /phone/i, key: 'phone' },
    { pattern: /email/i, key: 'email' },
    { pattern: /ssn/i, key: 'ssn' },
    { pattern: /creditcard/i, key: 'creditCard' },
    { pattern: /credit_card/i, key: 'credit_card' },
];

// Regex patterns for inline masking
const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: Record<string, unknown>;
    requestId?: string;
}

/**
 * Masks a value with asterisks, preserving first and last characters
 */
function maskValue(value: string): string {
    if (value.length <= 4) {
        return '****';
    }
    return value[0] + '*'.repeat(value.length - 2) + value[value.length - 1];
}

/**
 * Mask email addresses (show first char and domain)
 */
function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local[0]}***@${domain}`;
}

/**
 * Mask phone numbers (show last 4 digits)
 */
function maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return `***-***-${digits.slice(-4)}`;
}

/**
 * Deep clone and mask sensitive fields in an object
 */
function maskSensitiveData(data: unknown): unknown {
    if (data === null || data === undefined) {
        return data;
    }

    if (typeof data === 'string') {
        // Mask emails and phones in strings
        let masked = data.replace(EMAIL_REGEX, (match) => maskEmail(match));
        masked = masked.replace(PHONE_REGEX, (match) => maskPhone(match));
        return masked;
    }

    if (Array.isArray(data)) {
        return data.map((item) => maskSensitiveData(item));
    }

    if (typeof data === 'object') {
        const masked: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
            // Check if key matches sensitive patterns
            const isSensitive = SENSITIVE_PATTERNS.some((p) => p.pattern.test(key));

            if (isSensitive && typeof value === 'string') {
                masked[key] = maskValue(value);
            } else {
                masked[key] = maskSensitiveData(value);
            }
        }
        return masked;
    }

    return data;
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
    const parts = [
        `[${entry.timestamp}]`,
        `[${entry.level.toUpperCase()}]`,
    ];

    if (entry.requestId) {
        parts.push(`[${entry.requestId}]`);
    }

    parts.push(entry.message);

    if (entry.data) {
        parts.push(JSON.stringify(maskSensitiveData(entry.data)));
    }

    return parts.join(' ');
}

/**
 * Create a log entry
 */
function createLogEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    requestId?: string
): LogEntry {
    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        data,
        requestId,
    };
}

/**
 * Secure Logger - masks sensitive data before logging
 */
export const secureLogger = {
    info(message: string, data?: Record<string, unknown>, requestId?: string) {
        const entry = createLogEntry('info', message, data, requestId);
        console.log(formatLogEntry(entry));
    },

    warn(message: string, data?: Record<string, unknown>, requestId?: string) {
        const entry = createLogEntry('warn', message, data, requestId);
        console.warn(formatLogEntry(entry));
    },

    error(message: string, data?: Record<string, unknown>, requestId?: string) {
        const entry = createLogEntry('error', message, data, requestId);
        console.error(formatLogEntry(entry));
    },

    debug(message: string, data?: Record<string, unknown>, requestId?: string) {
        if (process.env.NODE_ENV !== 'production') {
            const entry = createLogEntry('debug', message, data, requestId);
            console.debug(formatLogEntry(entry));
        }
    },

    /**
     * Log an HTTP request (masks sensitive headers and body fields)
     */
    request(method: string, path: string, body?: unknown, headers?: Record<string, unknown>) {
        const maskedBody = body ? maskSensitiveData(body) : undefined;
        const maskedHeaders = headers ? maskSensitiveData(headers) : undefined;

        this.info(`${method} ${path}`, {
            body: maskedBody,
            headers: maskedHeaders
        } as Record<string, unknown>);
    },

    /**
     * Log an error with stack trace
     */
    exception(error: Error, context?: Record<string, unknown>) {
        this.error(error.message, {
            name: error.name,
            stack: error.stack,
            ...context,
        });
    },
};

export default secureLogger;
