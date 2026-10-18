"use client";
import { useRef, useState } from "react";
import { CalendarClock, CircleCheck } from "lucide-react";
import { LoginButton } from "@/components/shell/login-button";
import { Notice } from "@/components/record/notice";
import type { Hex } from "viem";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useArkivWallet } from "@/hooks/use-arkiv-wallet";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { snapshotKey } from "@/hooks/use-openpil-snapshot";
import { keepAlive } from "@/lib/arkiv/writes/keep-alive";
import { txUrl } from "@/lib/arkiv/chain";
import { blockToTime, type BlockTiming } from "@/lib/time";
import { BalanceNotice } from "@/components/wallet/balance-notice";
import { Button } from "@/components/ui/button";
import { dateLabel, type PetitionState } from "./presentation";
// Court decisions and extensions live at /court; this panel keeps the permissionless Keep alive action.
export function PetitionActions({ state, timing }: { state: PetitionState; timing: BlockTiming }) {
  const { walletClient, address, error } = useArkivWallet();
  const balance = useWalletBalance(address);
  const cache = useQueryClient();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [transaction, setTransaction] = useState<string>();
  const disabled = busy || !walletClient || balance.blocked;
  async function run(action: () => Promise<{ txHash: string }>, title: string) {
    if (lock.current || disabled) return;
    lock.current = true; setBusy(true);
    const id = toast.loading("Waiting for wallet signature…");
    try {
      const result = await action(); setTransaction(result.txHash);
      toast.success(title, { id, description: <a href={txUrl(result.txHash)} target="_blank" rel="noopener noreferrer">View transaction</a> });
      await cache.invalidateQueries({ queryKey: snapshotKey });
    } catch (failure) { toast.error("Transaction not confirmed", { id, description: failure instanceof Error ? failure.message : "Transaction failed" }); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="card card-pad petition-keepalive"><h2 className="t-h2">Keep this record public</h2><p>Records expire unless someone extends them. Anyone signed in can add 30 days.</p><BalanceNotice address={address} />{error && <Notice tone="error" title="Wallet unavailable">{error.message}</Notice>}{[state.petition, ...(state.decision ? [state.decision] : [])].map(record => <div className="petition-keep" key={record.key}><div><h3>{record === state.petition ? "Petition" : "Decision"}</h3><p>Ends {dateLabel(blockToTime(record.expiresAt, timing))}</p><small>After extending: {dateLabel(blockToTime((BigInt(record.expiresAt) + 30n * 43200n).toString(), timing))}</small></div>{address && <Button size="sm" variant="outline" disabled={disabled} onClick={() => walletClient && void run(() => keepAlive(walletClient, record.key as Hex), "Record extended")}><CalendarClock size={14} />{busy ? "Extending…" : "Add 30 days"}</Button>}</div>)}{!address && <div className="keep-signin"><p>Sign in to extend these records.</p><LoginButton /></div>}{transaction && <p className="keep-success" role="status"><CircleCheck size={16} /><a href={txUrl(transaction)} target="_blank" rel="noopener noreferrer">Confirmed. View transaction</a></p>}</section>;
}
