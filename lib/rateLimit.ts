/**
 * Basic in-memory rate limiting — guards against a script hammering /api/coach and quietly
 * burning through the Gemini free-tier daily quota (flagged as a real risk by the mentor,
 * since token usage is non-linear). In-memory is fine for this single-instance MVP; a real
 * multi-instance deployment would need a shared store (e.g. Firestore or Redis) instead.
 *
 * Two layers, not one: the per-client limit is keyed off X-Forwarded-For, which a client can
 * set to anything unless the app sits behind a trusted reverse proxy that overwrites it — so
 * it's spoofable and shouldn't be trusted alone. The global limit counts every request
 * regardless of key, so even a spoofed-IP attacker rotating through fake clients still hits a
 * hard ceiling on total Gemini calls per minute.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_CLIENT = 10;
const MAX_REQUESTS_GLOBAL = 30;
const GLOBAL_KEY = "__global__";

const requestLog = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

function recordAndCheck(key: string, limit: number, now: number): RateLimitResult {
  const windowStart = now - WINDOW_MS;
  const timestamps = (requestLog.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    const retryAfterSeconds = Math.ceil((timestamps[0] + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);
  return { allowed: true };
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();

  // Check the global backstop first — if that's blown, it doesn't matter whether this
  // particular client key is spoofed or not.
  const global = recordAndCheck(GLOBAL_KEY, MAX_REQUESTS_GLOBAL, now);
  if (!global.allowed) return global;

  return recordAndCheck(key, MAX_REQUESTS_PER_CLIENT, now);
}

export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}
