"use client";
import type { Address } from "viem";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { faucetUrl } from "@/lib/arkiv/balance";
import { Notice } from "@/components/record/notice";
import { Button } from "@/components/ui/button";
export function BalanceNotice({ address }: { address?: Address }) {
  const balance = useWalletBalance(address);
  if (!address) return null;
  if (balance.data === undefined) return <Notice tone={balance.isError ? "error" : "info"} title={balance.isError ? "Could not read your GLM balance. Actions are paused." : "Checking GLM balance before signing…"} action={balance.isError ? <Button size="sm" variant="outline" onClick={() => void balance.refetch()}>Retry</Button> : undefined} />;
  if (!balance.low && !balance.blocked) return null;
  return <Notice tone="warn" title={balance.blocked ? "This wallet cannot pay gas." : "Your wallet has less than 0.1 GLM."} action={<a href={faucetUrl} target="_blank" rel="noopener noreferrer">Get test GLM</a>}>Transactions require GLM for Tiramisu gas fees.</Notice>;
}
