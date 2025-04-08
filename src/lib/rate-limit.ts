// src/lib/security/rate-limit.ts
import { LRUCache } from "lru-cache";

type RateLimitOptions = {
  interval: number; // in ms
  limit: number;
  uniqueTokenPerInterval?: number;
};

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval || 500, // Default max unique keys
    ttl: options.interval, // Expiration time in ms
  });

  return {
    /**
     * Check if the token has reached its limit
     * @param token - Unique identifier for rate limiting (e.g., IP address)
     * @param limit - Optional limit to override the default
     */
    check: (token: string, limit = options.limit): Promise<void> => {
      // Get the token's current timestamps
      const timestamps = tokenCache.get(token) || [];

      // Remove timestamps outside of the rate limit window
      const now = Date.now();
      const windowStart = now - options.interval;

      // Filter to only keep timestamps within the current window
      const recentTimestamps = timestamps.filter((t) => t > windowStart);

      // Check if the number of requests exceeds the limit
      if (recentTimestamps.length >= limit) {
        return Promise.reject(new Error("Rate limit exceeded"));
      }

      // Add the current timestamp and update the cache
      tokenCache.set(token, [...recentTimestamps, now]);

      return Promise.resolve();
    },
  };
}
