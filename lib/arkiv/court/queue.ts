// Serializes tasks per key so one signer never has two writes in flight in this process.
export type WriteQueue = <T>(key: string, task: () => Promise<T>) => Promise<T>;
export function createWriteQueue(): WriteQueue {
  const tails = new Map<string, Promise<unknown>>();
  return (key, task) => {
    const previous = tails.get(key) ?? Promise.resolve();
    const run = previous.then(task, task);
    const tail = run.then(() => undefined, () => undefined);
    tails.set(key, tail);
    void tail.then(() => { if (tails.get(key) === tail) tails.delete(key); });
    return run;
  };
}
export const writeQueue = createWriteQueue();
