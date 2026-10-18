import { createPublicClient, createWalletClient } from "@arkiv-network/sdk";
import { custom, http, webSocket, type Address, type EIP1193Provider } from "viem";
import { TIRAMISU_PUBLIC_RPC_URL, tiramisu } from "./chain";
// Browser reads stay on the keyed proxy: anonymous public RPC calls share the per IP quota with the WebSocket handshake.
export const publicClient = createPublicClient({ chain: tiramisu, transport: http(typeof window === "undefined" ? TIRAMISU_PUBLIC_RPC_URL : "/api/arkiv", { retryCount: 0 }) });
export const createWebSocketClient = () => createPublicClient({ chain: tiramisu, transport: webSocket(undefined, { reconnect: false, retryCount: 0 }) });
export const createArkivWallet = (provider: Pick<EIP1193Provider, "request">, address: Address) => createWalletClient({ chain: tiramisu, transport: custom(provider), account: address });
export type ArkivWallet = Pick<ReturnType<typeof createArkivWallet>, "executeBatch" | "createEntity" | "patchEntity" | "changeOwnership" | "extendEntity"> & { account: { address: Address } };
// Reads shared by browser queries and server side preflight. The server supplies a credentialed client.
export type ArkivReader = Pick<typeof publicClient, "select" | "getEntity" | "getBlockTiming">;
