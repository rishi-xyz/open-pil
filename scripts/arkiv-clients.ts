import { createPublicClient } from "@arkiv-network/sdk";
import { http } from "viem";
import { tiramisu } from "../lib/arkiv/chain";

export function scriptTransport() {
  const key = process.env.TIRAMISU_API_KEY;
  return http(tiramisu.rpcUrls.default.http[0], {
    retryCount: 0,
    fetchOptions: { headers: key ? { "X-API-KEY": key } : undefined },
  });
}
export const publicClient = createPublicClient({ chain: tiramisu, transport: scriptTransport() });
