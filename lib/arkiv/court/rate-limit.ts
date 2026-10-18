// Sliding window per key, in memory. Resets on restart and is per process by design.
export type RateLimiter = { allow(key: string, now?: number): { ok: true } | { ok: false; retryAfter: number } };
export function createRateLimiter({ limit, windowMs, maxKeys = 10000 }: { limit: number; windowMs: number; maxKeys?: number }): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    allow(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter(at => now - at < windowMs);
      if (recent.length >= limit) { hits.set(key, recent); return { ok: false, retryAfter: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) }; }
      recent.push(now);
      hits.set(key, recent);
      if (hits.size > maxKeys) for (const [other, stamps] of hits) if (other !== key && !stamps.some(at => now - at < windowMs)) hits.delete(other);
      return { ok: true };
    },
  };
}
export function clientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
