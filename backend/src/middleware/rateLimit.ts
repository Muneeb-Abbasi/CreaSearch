import type { Request, Response, NextFunction } from 'express';

// In-memory rate limiting store
// For production, consider using Redis for distributed rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
    windowMs?: number;     // Time window in milliseconds
    maxRequests?: number;  // Max requests per window
    message?: string;      // Custom error message
}

const defaultOptions: Required<RateLimitOptions> = {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 100,     // 100 requests per minute
    message: 'Too many requests, please try again later.'
};

/**
 * Creates a rate limiting middleware
 */
export function rateLimit(options: RateLimitOptions = {}) {
    const { windowMs, maxRequests, message } = { ...defaultOptions, ...options };

    return (req: Request, res: Response, next: NextFunction) => {
        // Get client identifier (IP address or user ID if authenticated)
        const clientId = getClientIdentifier(req);
        const now = Date.now();

        // Get or create rate limit entry for this client
        let entry = requestCounts.get(clientId);

        if (!entry || now > entry.resetTime) {
            // Create new entry or reset expired one
            entry = { count: 1, resetTime: now + windowMs };
            requestCounts.set(clientId, entry);
        } else {
            // Increment request count
            entry.count++;
        }

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
        res.setHeader('X-RateLimit-Reset', entry.resetTime);

        // Check if limit exceeded
        if (entry.count > maxRequests) {
            res.status(429).json({
                error: message,
                retryAfter: Math.ceil((entry.resetTime - now) / 1000)
            });
            return;
        }

        next();
    };
}

/**
 * Get client identifier for rate limiting
 * Uses IP address, considering proxy headers
 */
function getClientIdentifier(req: Request): string {
    // Check for forwarded IP (when behind proxy/load balancer)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
        return ips.trim();
    }

    // Fall back to direct IP
    return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Stricter rate limit for authentication endpoints
 */
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 10,           // 10 requests per 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
});

/**
 * Standard API rate limit
 */
export const apiRateLimit = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 60,      // 60 requests per minute
    message: 'Rate limit exceeded. Please slow down.'
});

/**
 * Stricter rate limit for sensitive operations
 */
export const sensitiveRateLimit = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10,      // 10 requests per minute
    message: 'Rate limit exceeded for sensitive operations.'
});

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestCounts.entries()) {
        if (now > value.resetTime) {
            requestCounts.delete(key);
        }
    }
}, 5 * 60 * 1000);
