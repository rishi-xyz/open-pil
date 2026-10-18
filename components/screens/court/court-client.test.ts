import { describe, expect, it, vi } from "vitest";
import { courtErrorMessage, submitCourtAction } from "./court-client";
const petition = `0x${"ab".repeat(32)}`;
describe("court client", () => {
  it("posts same origin JSON and returns the hash and key", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ action: "decide", txHash: "0x1", entityKey: "0x2" }));
    await expect(submitCourtAction("decide", { petition, outcome: "accepted", reason: "ok" }, fetcher)).resolves.toEqual({ action: "decide", txHash: "0x1", entityKey: "0x2" });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("/api/court/decide");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("same-origin");
    expect(JSON.parse(init.body)).toEqual({ petition, outcome: "accepted", reason: "ok" });
  });
  it("surfaces the server message, falls back by status and rejects malformed success", async () => {
    expect(courtErrorMessage(409, { error: "A decision is already recorded" })).toBe("A decision is already recorded");
    expect(courtErrorMessage(429, undefined)).toMatch(/Too many/);
    expect(courtErrorMessage(500, "")).toMatch(/failed/);
    const fetcher = vi.fn().mockResolvedValue(Response.json({ error: "No live review lease was found" }, { status: 409 }));
    await expect(submitCourtAction("extend", { petition, due: 1, reason: "x" }, fetcher)).rejects.toThrow("No live review lease was found");
    fetcher.mockResolvedValue(Response.json({}));
    await expect(submitCourtAction("extend", { petition, due: 1, reason: "x" }, fetcher)).rejects.toThrow(/unexpected/);
  });
});
