"use client";
import { usePrivy } from "@privy-io/react-auth";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown, Copy, Droplets, ExternalLink, Loader2, LogOut, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useArkivWallet } from "@/hooks/use-arkiv-wallet";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { useOrgRegistry } from "@/hooks/use-org-registry";
import { faucetUrl } from "@/lib/arkiv/balance";
import { addressUrl } from "@/lib/arkiv/chain";
import { ClientReady } from "./client-ready";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/record/status-badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import styles from "./login-button.module.css";
function ConnectedLogin() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useArkivWallet();
  const balance = useWalletBalance(authenticated ? address : undefined);
  const registry = useOrgRegistry();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timeout.current), []);
  const org = registry.data?.pages.flatMap(page => page.records).find(record => record.attributes.wallet === address?.toLowerCase());
  const name = org && typeof org.payload === "object" && "name" in org.payload ? String(org.payload.name) : undefined;
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connecting wallet…";
  const letter = name?.[0] ?? address?.slice(2, 3).toUpperCase() ?? "?";
  async function copyAddress() {
    if (!address) return;
    try { await navigator.clipboard.writeText(address); setCopied(true); setCopyError(false); clearTimeout(timeout.current); timeout.current = setTimeout(() => setCopied(false), 2000); } catch { setCopyError(true); }
  }
  if (!ready || !authenticated) return <Button size="sm" disabled={!ready} onClick={login}>{!ready && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}Sign in</Button>;
  const balanceText = balance.label === undefined ? balance.isError ? "Unavailable" : undefined : `${balance.label} GLM`;
  return <Popover.Root><Popover.Trigger className="acct-chip" aria-label="Wallet account menu"><span className="account-avatar" data-court={!!org}>{letter}</span><span className="account-address mono">{short}</span><span className="account-balance" data-low={balance.low}>{(balance.isError && balance.label === undefined ? "Balance unavailable" : balanceText) ?? <Skeleton className="h-3 w-12" />}</span><ChevronDown size={14} className="account-chevron" /></Popover.Trigger><Popover.Portal><Popover.Positioner align="end" sideOffset={8} className="z-50"><Popover.Popup className="account-menu"><div className="account-identity"><span className="account-avatar" data-court={!!org}>{letter}</span><div><strong>{name ?? "Wallet"}</strong><div className="flex items-center gap-2"><span className="mono">{short}</span><Button size="icon-sm" variant="ghost" disabled={!address} aria-label="Copy address" onClick={() => void copyAddress()}>{copied ? <Check className="text-[var(--ok)]" /> : <Copy />}</Button></div>{org && <StatusBadge tone="seal">Registered court</StatusBadge>}</div></div><div className="account-menu-balance"><div className="t-label">Balance on Tiramisu</div><div className={styles.balanceValue}>{balanceText ? <strong className={balance.isError && balance.label === undefined ? "text-[var(--text-3)]" : undefined}>{balanceText}</strong> : <Skeleton className="h-5 w-24" />}<Tooltip><TooltipTrigger render={<Button size="icon-sm" variant="ghost" className={styles.refreshButton} disabled={balance.isFetching || !address} aria-label="Refresh balance" aria-busy={balance.isFetching} onClick={() => void balance.refetch()} />}><RefreshCw size={16} aria-hidden="true" className={balance.isFetching ? styles.refreshing : undefined} /></TooltipTrigger><TooltipContent>Refresh balance</TooltipContent></Tooltip></div>{balance.isError && <p role="status" className="t-small text-[var(--bad)]">Could not refresh balance.</p>}{(balance.low || balance.blocked) && <p className="t-small text-[var(--warn)]">{balance.blocked ? "This wallet cannot pay gas." : "Less than 0.1 GLM. Transactions may fail."}</p>}</div><div className="mt-2"><a className="account-menu-action" data-low={balance.low} href={faucetUrl} target="_blank" rel="noopener noreferrer"><Droplets />Get test GLM<ExternalLink className="ml-auto" /></a><button className="account-menu-action" disabled={!address} onClick={() => void copyAddress()}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy address"}</button>{address && <a className="account-menu-action" href={addressUrl(address)} target="_blank" rel="noopener noreferrer"><ExternalLink />View on Arkiv Explorer</a>}<Separator className="my-2" /><button className="account-menu-action" data-danger="true" onClick={() => void logout()}><LogOut />Sign out</button><span role="status" className="sr-only">{copyError ? "Could not copy address" : copied ? "Address copied" : ""}</span></div></Popover.Popup></Popover.Positioner></Popover.Portal></Popover.Root>;
}
export function LoginButton() {
  return process.env.NEXT_PUBLIC_PRIVY_APP_ID ? <ClientReady fallback={<Button size="sm" disabled><Loader2 className="size-3.5 animate-spin" aria-hidden="true" />Sign in</Button>}><ConnectedLogin /></ClientReady> : <Button size="sm" disabled>Sign in</Button>;
}
