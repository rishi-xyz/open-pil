import { describe, expect, it } from "vitest";
import { parseCourtRequest, MAX_COURT_BODY_BYTES } from "./schema";
const petition = `0x${"ab".repeat(32)}`;
describe("court request validation", () => {
  it("accepts a decision and lowercases the petition key", () => {
    const parsed = parseCourtRequest("decide", { petition: petition.toUpperCase().replace("0X", "0x"), outcome: "rejected", reason: "# No\n\nDismissed." });
    expect(parsed).toEqual({ data: { petition, outcome: "rejected", reason: "# No\n\nDismissed." } });
  });
  it("accepts an extension with an integer millisecond deadline", () => {
    expect(parseCourtRequest("extend", { petition, due: 1_800_000_000_000, reason: "More time" })).toEqual({ data: { petition, due: 1_800_000_000_000, reason: "More time" } });
  });
  it.each([
    ["missing reason", { petition, outcome: "accepted" }],
    ["empty reason", { petition, outcome: "accepted", reason: "" }],
    ["oversized reason", { petition, outcome: "accepted", reason: "é".repeat(16385) }],
    ["bad outcome", { petition, outcome: "maybe", reason: "x" }],
    ["bad key", { petition: "0x12", outcome: "accepted", reason: "x" }],
    ["unknown field", { petition, outcome: "accepted", reason: "x", txHash: "0x" }],
    ["array", []], ["null", null], ["string", "accept"],
  ])("rejects a decision with %s", (_, body) => {
    expect(parseCourtRequest("decide", body)).toHaveProperty("error");
  });
  it.each([
    ["string due", { petition, due: "2026-11-01", reason: "x" }],
    ["fractional due", { petition, due: 1.5, reason: "x" }],
    ["negative due", { petition, due: -1, reason: "x" }],
    ["outcome on extension", { petition, due: 1, outcome: "accepted", reason: "x" }],
  ])("rejects an extension with %s", (_, body) => {
    expect(parseCourtRequest("extend", body)).toHaveProperty("error");
  });
  it("keeps the reason cap equal to the 32 KB markdown limit and bounds the body above it", () => {
    expect(parseCourtRequest("decide", { petition, outcome: "accepted", reason: "a".repeat(32768) })).toHaveProperty("data");
    expect(parseCourtRequest("decide", { petition, outcome: "accepted", reason: "a".repeat(32769) })).toHaveProperty("error");
    expect(MAX_COURT_BODY_BYTES).toBeGreaterThan(32768);
  });
});
