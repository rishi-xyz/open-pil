import { formatUnits } from "viem";
import { tiramisu } from "./chain";
export const faucetUrl = "https://hub.arkiv.network/faucet";
export const balanceKey = (address?: string) => ["wallet-balance", tiramisu.id, address?.toLowerCase()] as const;
export const gasKey = (address?: string) => ["wallet-gas-required", tiramisu.id, address?.toLowerCase()] as const;
export function balanceState(balance?: string, requiredGas = "0") {
  const wei = balance === undefined ? undefined : BigInt(balance);
  return {
    low: wei !== undefined && wei < 10n ** 17n,
    blocked: wei === undefined || wei === 0n || wei < BigInt(requiredGas),
    label: wei === undefined ? undefined : wei > 0n && wei < 10n ** 14n ? "<0.0001" : formatUnits(wei, 18).replace(/(\.\d{4})\d+$/, "$1"),
  };
}
