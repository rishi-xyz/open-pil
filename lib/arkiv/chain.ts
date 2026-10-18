import { defineChain } from "viem";
export const TIRAMISU_PUBLIC_RPC_URL = process.env.NEXT_PUBLIC_TIRAMISU_RPC_URL ?? "https://rpc.tiramisu.db-chain.testnet.arkiv.network";
// The Privy embedded wallet gets the same-origin proxy, which adds the access key server side.
const rpcUrl = typeof window === "undefined" ? TIRAMISU_PUBLIC_RPC_URL : `${window.location.origin}/api/arkiv`;
export const tiramisu = defineChain({
  id: 7738577, name: "Tiramisu", nativeCurrency: { name: "GLM", symbol: "GLM", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl], webSocket: ["wss://rpc.tiramisu.db-chain.testnet.arkiv.network"] } },
  blockExplorers: { default: { name: "Arkiv Explorer", url: "https://tiramisu.explorer.arkiv.network" } }, testnet: true,
});
const explorer = tiramisu.blockExplorers.default.url;
export const entityUrl = (key: string) => `${explorer}/entity/${encodeURIComponent(key)}`;
export const addressUrl = (address: string) => `${explorer}/address/${encodeURIComponent(address)}`;
export const txUrl = (hash: string) => `${explorer}/tx/${encodeURIComponent(hash)}`;
