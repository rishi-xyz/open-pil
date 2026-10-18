import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArkivRecord } from "../records";
import { DECISION_EXISTS, NOT_REGISTERED_COURT } from "../writes/review-context";
import type { GuardContext } from "./guard";
import { courtHandler, type CourtDeps } from "./handler";
import { createWriteQueue } from "./queue";
import { createRateLimiter } from "./rate-limit";
const court = "0xDf7b54EbE12AB921C5000cEeA338bE66636668ed", petition = `0x${"ab".repeat(32)}`, txHash = `0x${"cd".repeat(32)}`, created = `0x${"ef".repeat(32)}`;
const review: ArkivRecord = { key: "review", creator: `0x${"a".repeat(40)}`, owner: court.toLowerCase(), createdAt: "50", expiresAt: "900", payload: {}, attributes: { app: "openpil", type: "review", petition, court: court.toLowerCase(), duedate: 2_000_000, extensions: 0 } };
const live = (): GuardContext => ({ review, decision: undefined, status: "under-review", due: 2_000_000, clock: { currentBlock: 100n, currentBlockTime: 1000, blockDuration: 2 } });
const headers = { "Content-Type": "application/json", origin: "https://openpil.example", host: "openpil.example", "x-forwarded-for": "203.0.113.5" };
const post = (body: unknown, extra: Record<string, string> = {}) => new Request("https://openpil.example/api/court/decide", { method: "POST", headers: { ...headers, ...extra }, body: typeof body === "string" ? body : JSON.stringify(body) });
const decision = { petition, outcome: "accepted", reason: "Admitted." };
function setup(context: () => Promise<GuardContext> = async () => live()) {
  const executeBatch = vi.fn().mockResolvedValue({ txHash, createdEntities: [created], patchedEntities: [], deletedEntities: [], extendedEntities: [], ownershipChanges: [] });
  const readContext = vi.fn(context);
  const deps: CourtDeps = { signer: { executeBatch, account: { address: court } }, readContext, attempts: createRateLimiter({ limit: 10, windowMs: 60_000 }), writes: createRateLimiter({ limit: 3, windowMs: 60_000 }), queue: createWriteQueue() };
  return { deps, executeBatch, readContext, decide: courtHandler("decide", deps), extend: courtHandler("extend", deps) };
}
describe("court route handler", () => {
  beforeEach(() => { vi.restoreAllMocks(); });
  it("re-reads chain state, signs one batch and returns the hash and created key", async () => {
    const { decide, executeBatch, readContext } = setup();
    const response = await decide(post(decision));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ action: "decide", txHash, entityKey: created });
    expect(readContext).toHaveBeenCalledWith(petition);
    const batch = executeBatch.mock.calls[0][0];
    expect(batch.creates).toHaveLength(1);
    expect(batch.deletes).toEqual([{ entityKey: "review" }]);
  });
  it("signs an extension with a later deadline", async () => {
    const { extend, executeBatch } = setup();
    const response = await extend(post({ petition, due: 3_000_000, reason: "More time." }));
    expect(response.status).toBe(200);
    const batch = executeBatch.mock.calls[0][0];
    expect(batch.patches[0].set.extensions).toBe(1);
    expect(batch.extensions).toHaveLength(1);
  });
  it("rejects cross origin requests before touching the chain", async () => {
    const { decide, readContext, executeBatch } = setup();
    expect((await decide(post(decision, { origin: "https://evil.example" }))).status).toBe(403);
    expect(readContext).not.toHaveBeenCalled();
    expect(executeBatch).not.toHaveBeenCalled();
  });
  it("rejects malformed, invalid and oversized bodies without writing", async () => {
    const { decide, executeBatch } = setup();
    expect((await decide(post("{not json"))).status).toBe(400);
    expect((await decide(post({ petition, outcome: "maybe", reason: "x" }))).status).toBe(400);
    expect((await decide(post({ petition, outcome: "accepted", reason: "" }))).status).toBe(400);
    expect((await decide(post({ petition, outcome: "accepted", reason: "x".repeat(100 * 1024) }))).status).toBe(413);
    expect(executeBatch).not.toHaveBeenCalled();
  });
  it("refuses with 409 when the chain state no longer allows the action", async () => {
    for (const [context, pattern] of [
      [{ ...live(), decision: review }, /already recorded/],
      [{ ...live(), review: undefined, status: "review-incomplete" as const }, /No live review/],
      [{ ...live(), status: "expired" as const }, /deadline has passed/],
    ] as const) {
      const { decide, executeBatch } = setup(async () => context);
      const response = await decide(post(decision));
      expect(response.status).toBe(409);
      expect((await response.json()).error).toMatch(pattern);
      expect(executeBatch).not.toHaveBeenCalled();
    }
    const { extend, executeBatch } = setup();
    expect((await extend(post({ petition, due: 2_000_000, reason: "x" }))).status).toBe(409);
    expect(executeBatch).not.toHaveBeenCalled();
  });
  it("maps preflight refusals to 409 and other read failures to a generic 502", async () => {
    for (const message of [NOT_REGISTERED_COURT, DECISION_EXISTS]) {
      const { decide } = setup(async () => { throw new Error(message); });
      expect((await decide(post(decision))).status).toBe(409);
    }
    const { decide, executeBatch } = setup(async () => { throw new Error("HTTP request failed. URL: https://rpc?key=secret"); });
    const response = await decide(post(decision));
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toMatch(/secret|rpc/);
    expect(executeBatch).not.toHaveBeenCalled();
  });
  it("never leaks provider errors from the write and keeps a known hash", async () => {
    const { decide, executeBatch } = setup();
    executeBatch.mockRejectedValueOnce(Object.assign(new Error("insufficient funds for gas * price + value at https://rpc.example"), { txHash }));
    const response = await decide(post(decision));
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.txHash).toBe(txHash);
    expect(body.error).not.toMatch(/insufficient|rpc\.example/);
  });
  it("rate limits attempts and writes per address", async () => {
    const { decide, executeBatch } = setup();
    for (let i = 0; i < 3; i++) expect((await decide(post(decision))).status).toBe(200);
    const limited = await decide(post(decision));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(executeBatch).toHaveBeenCalledTimes(3);
    expect((await decide(post(decision, { "x-forwarded-for": "203.0.113.6" }))).status).toBe(200);
    for (let i = 0; i < 6; i++) await decide(post("{bad", { "x-forwarded-for": "203.0.113.7" }));
    expect((await decide(post(decision, { "x-forwarded-for": "203.0.113.7" }))).status).toBe(200);
    for (let i = 0; i < 10; i++) await decide(post("{bad", { "x-forwarded-for": "203.0.113.8" }));
    expect((await decide(post(decision, { "x-forwarded-for": "203.0.113.8" }))).status).toBe(429);
  });
  it("serializes concurrent writes so the second one sees the first decision", async () => {
    let decided = false;
    const { decide, executeBatch } = setup(async () => decided ? { ...live(), decision: review } : live());
    executeBatch.mockImplementation(async () => { await new Promise(resolve => setTimeout(resolve, 5)); decided = true; return { txHash, createdEntities: [created], patchedEntities: [], deletedEntities: [], extendedEntities: [], ownershipChanges: [] }; });
    const [first, second] = await Promise.all([decide(post(decision)), decide(post(decision))]);
    expect([first.status, second.status]).toEqual([200, 409]);
    expect(executeBatch).toHaveBeenCalledTimes(1);
  });
});
