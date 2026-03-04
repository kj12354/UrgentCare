/**
 * In-Memory Sliding Window Rate Limiter
 *
 * WHY RATE LIMITING:
 * Without rate limiting, every API endpoint is vulnerable to:
 *   1. Brute-force attacks: An attacker can try millions of passwords/second
 *      against /api/auth/* endpoints until they find valid credentials.
 *   2. Credential stuffing: Automated bots try breach-dumped credentials at scale.
 *   3. Denial of Service (DoS): Flooding endpoints with requests to exhaust resources.
 *   4. AI API abuse: The /api/transcribe and /api/soap/* routes call OpenAI and Anthropic,
 *      which charge per-request. Unguarded endpoints = unlimited billing liability.
 *
 * ALGORITHM: Sliding Window
 * WHY sliding window over fixed window:
 * A fixed window (e.g., "5 requests per minute, window resets at :00 and :60")
 * can be gamed — an attacker sends 5 requests at :59, the window resets, then 5 more
 * at :01, achieving 10 requests in 2 seconds. A sliding window tracks the timestamps
 * of each request and counts only requests within the last N milliseconds.
 *
 * STORAGE: In-Memory Map
 * WHY not Redis: This implementation uses a simple in-process Map<key, timestamps[]>.
 * For a single-instance deployment (like a single Vercel function or one server),
 * this is sufficient and has zero infrastructure dependency.
 *
 * PRODUCTION NOTE: For multi-instance deployments (multiple Vercel regions, Kubernetes pods),
 * replace the Map with Redis INCR + EXPIRE commands. The interface is identical — only
 * the backing store changes. This is the correct way to scale rate limiting.
 *
 * MEMORY LEAK PREVENTION: Old timestamp buckets are automatically pruned on each call.
 * The Map is bounded by the number of unique IPs seen within the window. For a small
 * healthcare platform, this is fine. For massive scale, add a periodic cleanup job.
 */

// Stores request timestamps per rate limit key (IP + route combination)
const requestLog = new Map<string, number[]>();

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;    // Unix timestamp (ms) when the window resets
  retryAfter?: number; // Seconds to wait before retrying (only set when limited)
}

/**
 * Checks whether the given key has exceeded the rate limit.
 *
 * @param key      - Unique identifier for the rate limit bucket (typically IP + route)
 * @param limit    - Maximum number of requests allowed in the window
 * @param windowMs - Window size in milliseconds (e.g., 60000 for 1 minute)
 * @returns RateLimitResult indicating whether the request is allowed
 *
 * Usage:
 * ```ts
 * const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
 * const result = rateLimit(`auth:${ip}`, 5, 15 * 60 * 1000)
 * if (!result.success) {
 *   return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
 * }
 * ```
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Retrieve existing timestamps for this key, filtering out expired entries.
  // WHY filter expired entries: this is the "sliding" part of the sliding window —
  // we only care about requests within the current window, not historical ones.
  const existing = (requestLog.get(key) ?? []).filter((ts) => ts > windowStart);

  // Record the current request
  existing.push(now);
  requestLog.set(key, existing);

  const count = existing.length;
  const remaining = Math.max(0, limit - count);
  const oldestInWindow = existing[0] ?? now;
  const resetAt = oldestInWindow + windowMs;

  if (count > limit) {
    // Request is over the limit.
    // retryAfter tells the client exactly how long to wait before the oldest
    // request falls out of the window and frees a slot.
    const retryAfterMs = resetAt - now;
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil(retryAfterMs / 1000),
    };
  }

  return { success: true, limit, remaining, resetAt };
}

/**
 * Returns standard HTTP rate limit response headers.
 * These headers follow the IETF draft standard for RateLimit headers
 * (draft-ietf-httpapi-ratelimit-headers) so clients can adapt automatically.
 *
 * WHY expose rate limit headers: Transparency helps legitimate clients implement
 * backoff correctly. Security-through-obscurity on rate limits offers no benefit
 * since attackers can probe the limit anyway.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)), // Unix seconds
  };
  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = String(result.retryAfter);
  }
  return headers;
}

/**
 * Pre-configured rate limit presets for different endpoint types.
 *
 * WHY different limits per endpoint type:
 * - AUTH endpoints handle credential verification — must be strictly limited to
 *   prevent brute force. 5 attempts per 15 minutes matches NIST SP 800-63B guidance.
 * - AI endpoints (transcribe, SOAP) call paid APIs — limits protect against billing abuse.
 * - General API endpoints get a higher limit to allow normal application usage.
 */
export const RATE_LIMITS = {
  // Authentication: 5 attempts per 15 minutes per IP.
  // Matches NIST SP 800-63B recommendation for online guessing.
  AUTH: { limit: 5, windowMs: 15 * 60 * 1000 },

  // AI-powered endpoints: 20 per hour per IP.
  // Each call to Whisper or Claude costs money. This prevents billing attacks.
  AI: { limit: 20, windowMs: 60 * 60 * 1000 },

  // General PHI API: 60 requests per minute per IP.
  // Enough for normal usage; stops automated scrapers.
  API: { limit: 60, windowMs: 60 * 1000 },

  // Document operations: 30 per minute per IP.
  // More permissive than auth, but documents may contain large payloads.
  DOCUMENTS: { limit: 30, windowMs: 60 * 1000 },
} as const;

/**
 * Periodically clean up the in-memory request log to prevent unbounded memory growth.
 *
 * WHY: Every unique IP that hits the server creates an entry. On a busy server,
 * this could grow large. Pruning entries older than the longest window ensures
 * the Map doesn't grow indefinitely.
 *
 * This runs every 5 minutes in background. The 1-hour window for AI limits is the
 * longest window, so we prune anything older than 1 hour.
 */
const MAX_WINDOW_MS = 60 * 60 * 1000; // 1 hour — max window across all presets

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cutoff = Date.now() - MAX_WINDOW_MS;
    for (const [key, timestamps] of requestLog.entries()) {
      const fresh = timestamps.filter((ts) => ts > cutoff);
      if (fresh.length === 0) {
        requestLog.delete(key); // Remove fully expired keys
      } else {
        requestLog.set(key, fresh);
      }
    }
  }, 5 * 60 * 1000); // Run cleanup every 5 minutes
}
