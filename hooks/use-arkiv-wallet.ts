"use client";
import { useWallets, type EIP1193Provider as WalletProvider } from "@privy-io/react-auth";
import { balanceKey, gasKey } from "@/lib/arkiv/balance";
import { publicClient } from "@/lib/arkiv/clients";
import { useQueryClient, useQuery, type QueryClient } from "@tanstack/react-query";
import { toHex, type Address, type EIP1193Provider, type Hex } from "viem";
import { createArkivWallet } from "@/lib/arkiv/clients";
import { tiramisu } from "@/lib/arkiv/chain";
const noGas = "Your wallet cannot pay gas. Get test GLM from https://hub.arkiv.network/faucet.";
const unreachable = "Your wallet could not reach the Arkiv RPC. Check that your wallet network RPC is https://rpc.tiramisu.db-chain.testnet.arkiv.network or sign in with email.";
// Reads the wallet would otherwise make through its own RPC go through our proxy, then the public RPC.
const publicMethods = new Set(["eth_estimateGas", "eth_gasPrice", "eth_getTransactionCount", "eth_blockNumber", "eth_getTransactionReceipt"]);
const messageOf = (failure: unknown) => failure instanceof Error ? failure.message : String(failure);
const read = (method: string, params?: unknown[]) => publicClient.request({ method, params } as never) as Promise<Hex>;
const isNetworkFailure = (failure: unknown): boolean => /NetworkError|Failed to fetch|Load failed/i.test(messageOf(failure)) || (failure instanceof Error && failure.cause !== undefined && isNetworkFailure(failure.cause));
type Transaction = { from: Address; gas?: Hex; gasPrice?: Hex; maxFeePerGas?: Hex; nonce?: Hex; chainId?: Hex; type?: Hex };
export function createWalletRequest(provider: Pick<WalletProvider, "request">, address: Address, cache: Pick<QueryClient, "setQueryData">): EIP1193Provider["request"] {
  return async (args) => {
    if (publicMethods.has(args.method)) return read(args.method, args.params as unknown[] | undefined);
    if (args.method !== "eth_sendTransaction") return provider.request({ method: args.method, params: args.params as unknown[] | undefined });
    const [transaction] = args.params as [Transaction];
    const balance = await publicClient.getBalance({ address });
    cache.setQueryData(balanceKey(address), balance.toString());
    if (balance === 0n) throw new Error(noGas);
    let gas: Hex;
    try { gas = transaction.gas ?? await read("eth_estimateGas", [transaction]); }
    catch (failure) {
      if (/insufficient funds|insufficient balance/i.test(messageOf(failure))) {
        // The node rejected estimation for lack of funds; require a top-up before retrying.
        cache.setQueryData(gasKey(address), (balance + 1n).toString());
        throw new Error(noGas);
      }
      throw failure;
    }
    const [gasPrice, nonce] = await Promise.all([
      transaction.maxFeePerGas ?? transaction.gasPrice ? undefined : read("eth_gasPrice"),
      transaction.nonce ?? read("eth_getTransactionCount", [transaction.from, "pending"]),
    ]);
    const required = BigInt(gas) * BigInt((transaction.maxFeePerGas ?? transaction.gasPrice ?? gasPrice)!);
    cache.setQueryData(gasKey(address), required.toString());
    if (balance < required || balance === 0n) throw new Error(noGas);
    // Fill every field so the wallet signs and broadcasts without its own pre-send RPC reads.
    const filled = { ...transaction, gas, nonce, chainId: transaction.chainId ?? toHex(tiramisu.id), ...(gasPrice && { gasPrice, type: transaction.type ?? "0x0" }) };
    try { return await provider.request({ method: "eth_sendTransaction", params: [filled] }); }
    catch (failure) { throw isNetworkFailure(failure) ? new Error(unreachable, { cause: failure }) : failure; }
  };
}
export function useArkivWallet() {
  const cache = useQueryClient();
  const { wallets, ready } = useWallets();
  const wallet = wallets.find(wallet => wallet.walletClientType === "privy");
  const query = useQuery({ queryKey: ["arkiv-wallet", wallet?.address, wallet?.walletClientType, wallet?.chainId], enabled: ready && !!wallet, staleTime: Infinity, gcTime: 0, queryFn: async () => {
    if (!wallet) throw new Error("No connected wallet");
    await wallet.switchChain(tiramisu.id);
    const provider = await wallet.getEthereumProvider();
    const request = createWalletRequest(provider, wallet.address as Address, cache);
    const client = createArkivWallet({ request }, wallet.address as Address);
    return new Proxy(client, { get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (["executeBatch", "createEntity", "patchEntity", "changeOwnership", "extendEntity", "deleteEntity"].includes(String(property))) {
        return async (...args: unknown[]) => {
          await wallet.switchChain(tiramisu.id);
          try { return await Reflect.apply(value, target, args); }
          finally { void cache.invalidateQueries({ queryKey: balanceKey(wallet.address) }); }
        };
      }
      return value;
    } });
  } });
  return { ...query, walletClient: wallet ? query.data : undefined, address: wallet?.address as Address | undefined, ready };
}
