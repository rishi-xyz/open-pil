import { expect, it } from "vitest";
import { blockToTime } from "./time";
import { isRateLimited, retryDelay } from "./arkiv/retry";
it("converts past and future blocks using network timing", () => {
  const timing = { currentBlock: "100", currentBlockTime: 1000, blockDuration: 2 };
  expect(blockToTime("90", timing)).toBe(980000);
  expect(blockToTime("110", timing)).toBe(1020000);
});
it("backs off on nested rate limits", () => {
  const error = { cause: { status: 429 } };
  expect(isRateLimited(error)).toBe(true);
  expect(isRateLimited(new Error("reverted"))).toBe(false);
  expect(retryDelay(0, error)).toBe(60000);
  expect(retryDelay(1, error)).toBe(120000);
  expect(retryDelay(10, error)).toBe(240000);
});
