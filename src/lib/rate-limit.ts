import type { NextRequest } from "next/server";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

// Best-effort, in-memory only: resets on cold start and isn't shared across concurrent serverless
// instances, so this is a speed bump against casual/naive abuse, not a hard guarantee. A real
// production deployment would back this with a shared store instead (e.g. Upstash Redis or Unkey).
const buckets = new Map<string, RateLimitBucket>();

function getClientId(request: NextRequest): string {
  // Vercel (and most proxies) set this to "client, proxy1, proxy2, ..." - the first entry is the
  // original caller. Falls back to one shared bucket for direct/local requests with no proxy.
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

/**
 * True if this request is within its rate limit for the given route, false if it should be
 * rejected. `routeKey` scopes the limit per caller of this function, so different routes each get
 * their own budget instead of sharing one counter per IP.
 *
 * Set RATE_LIMIT_ENABLED=false to turn this off entirely, e.g. for local development or automated
 * tests where hitting the limit while iterating would just get in the way. Defaults to enabled -
 * unset or any other value keeps limiting on, so it fails safe if the env var is simply missing.
 */
export function isWithinRateLimit(request: NextRequest, routeKey: string, limit: number, windowMs: number): boolean {
  if (process.env.RATE_LIMIT_ENABLED === "false") return true;

  const bucketKey = `${routeKey}:${getClientId(request)}`;
  const now = Date.now();
  const bucket = buckets.get(bucketKey);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}
