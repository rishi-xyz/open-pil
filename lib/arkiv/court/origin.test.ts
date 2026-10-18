import { describe, expect, it } from "vitest";
import { sameOrigin } from "./origin";
const request = (headers: Record<string, string>) => new Request("http://internal:3000/api/court/decide", { method: "POST", headers });
describe("same origin check", () => {
  it("accepts a matching origin and host, including a forwarded host", () => {
    expect(sameOrigin(request({ origin: "https://openpil.example", host: "openpil.example" }))).toBe(true);
    expect(sameOrigin(request({ origin: "https://openpil.example", host: "internal:3000", "x-forwarded-host": "openpil.example" }))).toBe(true);
    expect(sameOrigin(request({ origin: "http://localhost:3400", host: "localhost:3400", "sec-fetch-site": "same-origin" }))).toBe(true);
  });
  it("accepts sec-fetch-site same-origin without an origin header", () => {
    expect(sameOrigin(request({ host: "openpil.example", "sec-fetch-site": "same-origin" }))).toBe(true);
  });
  it("rejects cross site, mismatched, malformed and absent origins", () => {
    expect(sameOrigin(request({ origin: "https://evil.example", host: "openpil.example" }))).toBe(false);
    expect(sameOrigin(request({ origin: "https://openpil.example", host: "openpil.example", "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(sameOrigin(request({ origin: "null", host: "openpil.example" }))).toBe(false);
    expect(sameOrigin(request({ host: "openpil.example" }))).toBe(false);
    expect(sameOrigin(request({ origin: "https://openpil.example" }))).toBe(false);
  });
});
