import "server-only";
import { createPublicClient, createWalletClient } from "@arkiv-network/sdk";
import { http, type Address, type Hex } from "viem";
import { nonceManager, privateKeyToAccount } from "viem/accounts";
import { TIRAMISU_PUBLIC_RPC_URL, tiramisu } from "../chain";
import { addressSchema } from "../model";
// The court key stays in server runtime environment. It is never read in client bundles or NEXT_PUBLIC variables.
const courtKey = () => { const key = process.env.ORG_MUNICIPAL_PRIVATE_KEY; return key && /^0x[0-9a-fA-F]{64}$/.test(key) ? key as Hex : undefined; };
export function courtAddress(): Address | undefined { const key = courtKey(); return key ? privateKeyToAccount(key).address : undefined; }
export function registryAddress(): Hex | undefined { const parsed = addressSchema.safeParse(process.env.NEXT_PUBLIC_REGISTRY_ADDRESS); return parsed.success ? parsed.data as Hex : undefined; }
function serverTransport() {
  const apiKey = process.env.TIRAMISU_API_KEY;
  return http(TIRAMISU_PUBLIC_RPC_URL, { retryCount: 0, timeout: 15_000, fetchOptions: { headers: apiKey ? { "X-API-KEY": apiKey } : undefined, cache: "no-store", redirect: "error" } });
}
let clients: { key: Hex; reader: ReturnType<typeof createReader>; signer: ReturnType<typeof createSigner> } | undefined;
const createReader = () => createPublicClient({ chain: tiramisu, cacheTime: 0, transport: serverTransport() });
const createSigner = (key: Hex) => createWalletClient({ chain: tiramisu, transport: serverTransport(), account: privateKeyToAccount(key, { nonceManager }) });
export function courtClients() {
  const key = courtKey();
  if (!key) return undefined;
  if (!clients || clients.key !== key) clients = { key, reader: createReader(), signer: createSigner(key) };
  return clients;
}
