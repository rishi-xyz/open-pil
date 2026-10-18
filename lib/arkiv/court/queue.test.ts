import { describe, expect, it } from "vitest";
import { createWriteQueue } from "./queue";
const defer = <T,>() => { let resolve!: (value: T) => void, reject!: (error: unknown) => void; const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; }); return { promise, resolve, reject }; };
describe("write queue", () => {
  it("runs tasks for one key strictly one after another", async () => {
    const queue = createWriteQueue();
    const first = defer<string>();
    const order: string[] = [];
    const a = queue("court", async () => { order.push("a:start"); const value = await first.promise; order.push("a:end"); return value; });
    const b = queue("court", async () => { order.push("b:start"); return "b"; });
    await Promise.resolve();
    expect(order).toEqual(["a:start"]);
    first.resolve("a");
    expect(await a).toBe("a");
    expect(await b).toBe("b");
    expect(order).toEqual(["a:start", "a:end", "b:start"]);
  });
  it("continues after a failed task and keeps keys independent", async () => {
    const queue = createWriteQueue();
    await expect(queue("court", async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    await expect(queue("court", async () => "next")).resolves.toBe("next");
    const gate = defer<void>();
    const slow = queue("court", () => gate.promise);
    await expect(queue("other", async () => "parallel")).resolves.toBe("parallel");
    gate.resolve();
    await slow;
  });
});
