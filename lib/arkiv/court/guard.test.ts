import { describe, expect, it } from "vitest";
import type { ArkivRecord } from "../records";
import { courtGuard, type GuardContext } from "./guard";
const court = `0x${"b".repeat(40)}`, other = `0x${"c".repeat(40)}`, petition = `0x${"ab".repeat(32)}`;
const review: ArkivRecord = { key: "review", creator: `0x${"a".repeat(40)}`, owner: court, createdAt: "50", expiresAt: "900", payload: {}, attributes: { app: "openpil", type: "review", petition, court, duedate: 2_000_000, extensions: 0 } };
const context = (over: Partial<GuardContext> = {}): GuardContext => ({ review, decision: undefined, status: "under-review", due: 2_000_000, clock: { currentBlock: 100n, currentBlockTime: 1000, blockDuration: 2 }, ...over });
const decide = { petition, outcome: "accepted" as const, reason: "ok" };
describe("court guard", () => {
  it("allows a decision and an extension on a live review before the deadline", () => {
    expect(courtGuard(context(), court, "decide", decide)).toBeNull();
    expect(courtGuard(context(), court.toUpperCase(), "extend", { petition, due: 2_000_001, reason: "ok" })).toBeNull();
  });
  it("refuses when a decision exists", () => {
    expect(courtGuard(context({ decision: review }), court, "decide", decide)).toMatch(/already recorded/);
  });
  it("refuses without a live review", () => {
    expect(courtGuard(context({ review: undefined, status: "review-incomplete" }), court, "decide", decide)).toMatch(/No live review/);
  });
  it("refuses a review owned by another court", () => {
    expect(courtGuard(context({ review: { ...review, owner: other } }), court, "decide", decide)).toMatch(/not owned/);
  });
  it("refuses once the deadline passed, by chain time or derived status", () => {
    expect(courtGuard(context({ clock: { currentBlock: 100n, currentBlockTime: 2001, blockDuration: 2 } }), court, "decide", decide)).toMatch(/deadline has passed/);
    expect(courtGuard(context({ status: "expired" }), court, "decide", decide)).toMatch(/deadline has passed/);
  });
  it("requires a strictly later extension deadline", () => {
    expect(courtGuard(context(), court, "extend", { petition, due: 2_000_000, reason: "ok" })).toMatch(/after the current deadline/);
    expect(courtGuard(context(), court, "extend", { petition, due: 1, reason: "ok" })).toMatch(/after the current deadline/);
  });
});
