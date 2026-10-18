import { expect, it } from "vitest";
import { CORS_HEADERS, proxyResponseHeaders } from "./headers";

it("passes provider rate limit and retry headers without forwarding credentials or cookies", () => {
  const headers = proxyResponseHeaders(new Headers({
    RateLimit: '"default";r=5;t=10', "RateLimit-Limit": "6", "RateLimit-Remaining": "5",
    "RateLimit-Reset": "10", "Retry-After": "10", "X-RateLimit-Remaining": "5",
    "X-API-KEY": "private", "Set-Cookie": "private", "Content-Length": "100",
  }));
  expect(headers.get("ratelimit")).toBe('"default";r=5;t=10');
  expect(headers.get("ratelimit-limit")).toBe("6");
  expect(headers.get("ratelimit-remaining")).toBe("5");
  expect(headers.get("ratelimit-reset")).toBe("10");
  expect(headers.get("retry-after")).toBe("10");
  expect(headers.get("x-ratelimit-remaining")).toBe("5");
  expect(headers.get("x-api-key")).toBeNull();
  expect(headers.get("set-cookie")).toBeNull();
  expect(headers.get("content-length")).toBeNull();
  expect(headers.get("cache-control")).toBe("no-store");
  expect(headers.get("access-control-allow-origin")).toBe("*");
});

it("allows browser wallet preflights that send request-source", () => {
  expect(CORS_HEADERS["Access-Control-Allow-Methods"]).toBe("POST, OPTIONS");
  expect(CORS_HEADERS["Access-Control-Allow-Headers"].split(", ")).toEqual(["content-type", "request-source"]);
});
