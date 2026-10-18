import { describe, expect, it } from "vitest";
import { balanceKey, balanceState, gasKey } from "./balance";
describe("wallet balance policy", () => {
  it("blocks unknown and zero balances without treating unknown as low", () => {
    expect(balanceState()).toMatchObject({ blocked: true, low: false });
    expect(balanceState("0")).toMatchObject({ blocked: true, low: true, label: "0" });
  });
  it("offers the faucet below 0.1 GLM without using that as the gas threshold", () => {
    expect(balanceState("99999999999999999")).toMatchObject({ blocked: false, low: true });
    expect(balanceState("100000000000000000")).toMatchObject({ blocked: false, low: false, label: "0.1" });
  });
  it("blocks a positive balance below the transaction gas estimate", () => {
    expect(balanceState("100", "101").blocked).toBe(true);
    expect(balanceState("101", "101").blocked).toBe(false);
    expect(balanceState("102", "101").blocked).toBe(false);
  });
  it("keeps small balances distinct from zero and truncates display precisely", () => {
    expect(balanceState("1").label).toBe("<0.0001");
    expect(balanceState("1234567890123456789").label).toBe("1.2345");
  });
  it("scopes both caches by chain and normalized wallet", () => {
    expect(balanceKey("0xAbC")).toEqual(balanceKey("0xabc"));
    expect(gasKey("0xAbC")).toEqual(gasKey("0xabc"));
    expect(balanceKey("0xabc")).not.toEqual(balanceKey("0xdef"));
  });
});
