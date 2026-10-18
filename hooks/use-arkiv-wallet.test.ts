import { beforeEach, describe, expect, it, vi } from "vitest";
const rpc = vi.hoisted(() => ({ request: vi.fn(), getBalance: vi.fn() }));
vi.mock("@privy-io/react-auth", () => ({ useWallets: vi.fn() }));
vi.mock("@/lib/arkiv/clients", () => ({ publicClient: rpc, createArkivWallet: vi.fn() }));
import { createWalletRequest } from "./use-arkiv-wallet";
import { gasKey } from "@/lib/arkiv/balance";

const address = "0x00000000000000000000000000000000000000aa";
const transaction = { from: address, to: "0x00000000000000000000000000000000000000bb", data: "0x1234", chainId: "0x7614d1" };
const reads: Record<string, unknown> = { eth_estimateGas: "0x5208", eth_gasPrice: "0x3b9aca00", eth_getTransactionCount: "0x7" };
const setup = () => {
  const provider = { request: vi.fn(async ({ method }: { method: string }) => method === "eth_sendTransaction" ? "0xhash" : "0x7614d1") };
  const cache = { setQueryData: vi.fn() };
  return { provider, cache, request: createWalletRequest(provider, address, cache) };
};
const send = (request: ReturnType<typeof setup>["request"], tx: object = transaction) => request({ method: "eth_sendTransaction", params: [tx] } as never);

describe("arkiv wallet request", () => {
  beforeEach(() => {
    rpc.request.mockReset().mockImplementation(async ({ method }: { method: string }) => reads[method]);
    rpc.getBalance.mockReset().mockResolvedValue(10n ** 18n);
  });
  it.each(["eth_estimateGas", "eth_gasPrice", "eth_getTransactionCount"])("reads %s through the public client, never the wallet", async method => {
    const { provider, request } = setup();
    await expect(request({ method, params: [] } as never)).resolves.toBe(reads[method]);
    expect(rpc.request).toHaveBeenCalledWith({ method, params: [] });
    expect(provider.request).not.toHaveBeenCalled();
  });
  it("forwards other methods to the wallet", async () => {
    const { provider, request } = setup();
    await expect(request({ method: "eth_chainId" })).resolves.toBe("0x7614d1");
    expect(provider.request).toHaveBeenCalledWith({ method: "eth_chainId", params: undefined });
  });
  it("fills gas, legacy gas price, nonce and chain id before the wallet sends", async () => {
    const { provider, cache, request } = setup();
    await expect(send(request, { ...transaction, chainId: undefined })).resolves.toBe("0xhash");
    expect(provider.request).toHaveBeenCalledTimes(1);
    expect(provider.request).toHaveBeenCalledWith({ method: "eth_sendTransaction", params: [{ ...transaction, gas: "0x5208", gasPrice: "0x3b9aca00", type: "0x0", nonce: "0x7", chainId: "0x7614d1" }] });
    expect(rpc.request).toHaveBeenCalledWith({ method: "eth_estimateGas", params: [{ ...transaction, chainId: undefined }] });
    expect(rpc.request).toHaveBeenCalledWith({ method: "eth_getTransactionCount", params: [address, "pending"] });
    expect(cache.setQueryData).toHaveBeenCalledWith(gasKey(address), (0x5208n * 0x3b9aca00n).toString());
  });
  it("keeps caller supplied fees and nonce", async () => {
    const { provider, request } = setup();
    const supplied = { ...transaction, gas: "0x10", maxFeePerGas: "0x2", nonce: "0x3" };
    await send(request, supplied);
    expect(rpc.request).not.toHaveBeenCalled();
    expect(provider.request).toHaveBeenCalledWith({ method: "eth_sendTransaction", params: [supplied] });
  });
  it("blocks the send when estimation reports insufficient funds", async () => {
    rpc.request.mockRejectedValueOnce(new Error("insufficient funds for gas * price + value"));
    const { provider, cache, request } = setup();
    await expect(send(request)).rejects.toThrow("Your wallet cannot pay gas.");
    expect(cache.setQueryData).toHaveBeenCalledWith(gasKey(address), (10n ** 18n + 1n).toString());
    expect(provider.request).not.toHaveBeenCalled();
  });
  it("explains a wallet that cannot reach the RPC", async () => {
    const { provider, request } = setup();
    const failure = new Error("An unknown RPC error occurred.", { cause: new TypeError("NetworkError when attempting to fetch resource.") });
    provider.request.mockRejectedValueOnce(failure);
    const error = await send(request).catch((caught: unknown) => caught) as Error;
    expect(error.message).toBe("Your wallet could not reach the Arkiv RPC. Check that your wallet network RPC is https://rpc.tiramisu.db-chain.testnet.arkiv.network or sign in with email.");
    expect(error.cause).toBe(failure);
  });
  it("rethrows other wallet errors unchanged", async () => {
    const { provider, request } = setup();
    const rejected = Object.assign(new Error("User rejected the request."), { code: 4001 });
    provider.request.mockRejectedValueOnce(rejected);
    await expect(send(request)).rejects.toBe(rejected);
  });
});
