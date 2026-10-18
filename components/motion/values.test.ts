import { describe, expect, it } from "vitest";
import { leaseFraction } from "./values";
describe("motion data", () => {
  it("clamps leases before opening, after expiry and with invalid durations", () => {
    expect(leaseFraction(100, 200, 50)).toBe(1);
    expect(leaseFraction(100, 200, 125)).toBe(.75);
    expect(leaseFraction(100, 200, 250)).toBe(0);
    expect(leaseFraction(200, 100, 150)).toBe(0);
  });
});
