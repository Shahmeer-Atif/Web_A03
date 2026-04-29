// Token-bucket rate limiter stored in globalThis so it survives hot-reload.
// Agents: 50 requests/min. Admins: 1000/min (effectively unlimited).
// Call checkRateLimit() from API route handlers (not from proxy — proxy is edge-only).

const AGENT_LIMIT = 50;
const ADMIN_LIMIT = 1000;
const WINDOW_MS = 60_000;

interface Bucket {
  tokens: number;
  lastRefill: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __rateBuckets: Map<string, Bucket> | undefined;
}

function getBuckets(): Map<string, Bucket> {
  if (!globalThis.__rateBuckets) globalThis.__rateBuckets = new Map();
  return globalThis.__rateBuckets;
}

function getLimit(role: string) {
  return role === "agent" ? AGENT_LIMIT : ADMIN_LIMIT;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, role: string): RateLimitResult {
  const limit = getLimit(role);
  const buckets = getBuckets();
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: limit, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill tokens proportionally to elapsed time
  const elapsed = now - bucket.lastRefill;
  if (elapsed >= WINDOW_MS) {
    bucket.tokens = limit;
    bucket.lastRefill = now;
  } else {
    const refill = Math.floor((elapsed / WINDOW_MS) * limit);
    if (refill > 0) {
      bucket.tokens = Math.min(limit, bucket.tokens + refill);
      bucket.lastRefill = now;
    }
  }

  if (bucket.tokens <= 0) {
    const retryAfterSeconds = Math.ceil((WINDOW_MS - elapsed) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: bucket.tokens, retryAfterSeconds: 0 };
}
