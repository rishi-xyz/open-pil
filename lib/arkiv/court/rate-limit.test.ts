import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "./rate-limit";
describe("in memory rate limit", () => {
  it("allows up to the limit inside the window and reports a retry delay after it", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    expect(limiter.allow("a", 0)).toEqual({ ok: true });
    expect(limiter.allow("a", 1_000)).toEqual({ ok: true });
    expect(limiter.allow("a", 2_000)).toEqual({ ok: false, retryAfter: 58 });
    expect(limiter.allow("b", 2_000)).toEqual({ ok: true });
  });
  it("slides the window", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10_000 });
    expect(limiter.allow("a", 0).ok).toBe(true);
    expect(limiter.allow("a", 9_999).ok).toBe(false);
    expect(limiter.allow("a", 10_000).ok).toBe(true);
  });
  it("does not count refused attempts against the window", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10_000 });
    limiter.allow("a", 0);
    for (let at = 1; at < 5; at++) limiter.allow("a", at);
    expect(limiter.allow("a", 10_000).ok).toBe(true);
  });
  it("evicts idle keys past the key cap", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10, maxKeys: 2 });
    limiter.allow("a", 0); limiter.allow("b", 0); limiter.allow("c", 100);
    expect(limiter.allow("a", 100).ok).toBe(true);
  });
  it("reads the first forwarded address, then real ip, then unknown", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }))).toBe("203.0.113.5");
    expect(clientIp(new Headers({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
