import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

it("keeps the public RPC on the server", async () => {
  const { TIRAMISU_PUBLIC_RPC_URL, tiramisu } = await import("./chain");
  expect(tiramisu.rpcUrls.default.http).toEqual([TIRAMISU_PUBLIC_RPC_URL]);
});

it("points browser wallets at the same-origin proxy", async () => {
  vi.stubGlobal("window", { location: { origin: "https://openpil.example" } });
  const { TIRAMISU_PUBLIC_RPC_URL, tiramisu } = await import("./chain");
  expect(tiramisu.rpcUrls.default.http).toEqual(["https://openpil.example/api/arkiv"]);
  expect(TIRAMISU_PUBLIC_RPC_URL).toMatch(/^https:\/\//);
});
