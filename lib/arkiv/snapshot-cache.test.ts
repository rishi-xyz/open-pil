import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { readSnapshotCache, saveSnapshotCache, snapshotStorageKey } from "./snapshot-cache";
import type { OpenpilSnapshot } from "./snapshot";

const snapshot: OpenpilSnapshot = {
  records: [{ key: `0x${"a".repeat(64)}`, creator: `0x${"b".repeat(40)}`, owner: `0x${"b".repeat(40)}`, createdAt: "1", expiresAt: "100", attributes: { app: "openpil", type: "review", petition: `0x${"a".repeat(64)}`, court: `0x${"b".repeat(40)}`, duedate: "1000", extensions: 0 }, payload: {} }],
  timing: { currentBlock: "42", currentBlockTime: 100, blockDuration: 2 },
};
function storage() {
  const values = new Map<string, string>();
  const sessionStorage = { getItem: vi.fn((key: string) => values.get(key) ?? null), setItem: vi.fn((key: string, value: string) => { values.set(key, value); }) };
  vi.stubGlobal("window", { sessionStorage });
  return sessionStorage;
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("session snapshot cache", () => {
  it("round trips serialized records, timing and fetch time", () => {
    const store = storage();
    const savedAt = Date.now() - 1000;
    saveSnapshotCache(snapshot, savedAt);
    expect(store.setItem).toHaveBeenCalledWith(snapshotStorageKey, JSON.stringify({ snapshot, savedAt }));
    expect(readSnapshotCache()).toEqual({ snapshot, savedAt });
  });
  it("falls back for absent, corrupt or invalid data", () => {
    const store = storage();
    expect(readSnapshotCache()).toBeUndefined();
    for (const raw of ["{", "null", JSON.stringify({ snapshot }), JSON.stringify({ snapshot, savedAt: "today" }), JSON.stringify({ snapshot: { ...snapshot, timing: { ...snapshot.timing, currentBlock: 42 } }, savedAt: Date.now() }), JSON.stringify({ snapshot: { ...snapshot, records: [{ ...snapshot.records[0], payload: null }] }, savedAt: Date.now() }), JSON.stringify({ snapshot, savedAt: Date.now() + 60000 })]) {
      store.setItem(snapshotStorageKey, raw);
      expect(readSnapshotCache()).toBeUndefined();
    }
  });
  it("handles unavailable storage, throwing accessors and failed writes", () => {
    vi.stubGlobal("window", undefined);
    expect(readSnapshotCache()).toBeUndefined();
    expect(() => saveSnapshotCache(snapshot)).not.toThrow();
    vi.stubGlobal("window", { get sessionStorage() { throw new Error("denied"); } });
    expect(readSnapshotCache()).toBeUndefined();
    expect(() => saveSnapshotCache(snapshot)).not.toThrow();
    const store = storage();
    store.getItem.mockImplementation(() => { throw new Error("denied"); });
    store.setItem.mockImplementation(() => { throw new Error("quota"); });
    expect(readSnapshotCache()).toBeUndefined();
    expect(() => saveSnapshotCache(snapshot)).not.toThrow();
  });
  it.each([1000, 59999, 60001])("uses the saved age (%i ms) to decide whether to fetch on a new query client", async age => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    storage();
    saveSnapshotCache(snapshot, Date.now() - age);
    const cached = readSnapshotCache()!;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const queryFn = vi.fn(async () => snapshot);
    const observer = new QueryObserver(client, { queryKey: ["openpil-snapshot"], queryFn, initialData: cached.snapshot, initialDataUpdatedAt: cached.savedAt, staleTime: 60000 });
    const unsubscribe = observer.subscribe(() => {});
    await Promise.resolve();
    expect(queryFn).toHaveBeenCalledTimes(age < 60000 ? 0 : 1);
    expect(observer.getCurrentResult().data).toEqual(snapshot);
    unsubscribe();
    client.clear();
  });
});

it("round trips revision 3 markdown payloads", () => {
  storage();
  const next: OpenpilSnapshot = { ...snapshot, records: [{ ...snapshot.records[0], attributes: { app: "openpil", type: "petition", title: "Civic water", court: "VPHC", filedat: "1000", duedate: "2000" }, payload: "# Civic water\n\nPrayer for relief" }] };
  saveSnapshotCache(next);
  expect(readSnapshotCache()?.snapshot).toEqual(next);
});
