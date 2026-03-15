import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface CacheEntry {
  data: any;
  timestamp: number;
}

// Simple in-memory cache store
const cacheStore = new Map<string, CacheEntry>();

/**
 * Middleware to cache API responses in memory.
 * 
 * @param ttlSeconds Time-to-live for the cache entry in seconds
 */
export const cacheMiddleware = (ttlSeconds: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Use URL + query params as the cache key
    // For authenticated paths, we include user_id in the key to prevent leaking data
    let key = req.originalUrl;
    
    // If the request has an authenticated user, namespace the cache per user
    // However, this cache is primarily intended for public endpoints.
    // If used on auth endpoints, user ID must be part of the key.
    if ((req as any).user && (req as any).user.id) {
        key = `${(req as any).user.id}:${key}`;
    }

    const cached = cacheStore.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp < ttlSeconds * 1000)) {
      // Return cached response
      logger.debug(`[Cache] HIT for ${key}`);
      return res.json(cached.data);
    }

    logger.debug(`[Cache] MISS for ${key}`);

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to capture the response
    res.json = (data: any) => {
      // Only cache successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheStore.set(key, {
          data,
          timestamp: Date.now(),
        });
      }
      
      // Call original method
      return originalJson(data);
    };

    next();
  };
};

/**
 * Manually invalidate a cache key or pattern
 * @param prefix The prefix to match and delete from cache
 */
export const invalidateCache = (prefix: string) => {
  let count = 0;
  for (const key of cacheStore.keys()) {
    if (key.includes(prefix)) {
      cacheStore.delete(key);
      count++;
    }
  }
  logger.info(`[Cache] Invalidated ${count} entries matching "${prefix}"`);
};

export const clearAllCache = () => {
    cacheStore.clear();
    logger.info(`[Cache] Cleared all entries`);
};
