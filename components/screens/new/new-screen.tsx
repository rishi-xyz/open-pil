"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { Address } from "viem";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useArkivWallet } from "@/hooks/use-arkiv-wallet";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { snapshotKey, useOpenpilSnapshot } from "@/hooks/use-openpil-snapshot";
import { registeredCourts } from "@/lib/arkiv/trust/revision3";
import { filePetition } from "@/lib/arkiv/writes/file-petition";
import { Wallet, CircleCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/record/notice";
import { StatusBadge } from "@/components/record/status-badge";
import { AddressChip } from "@/components/record/address-chip";
import { BalanceNotice } from "@/components/wallet/balance-notice";
import { txUrl } from "@/lib/arkiv/chain";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { LoginButton } from "@/components/shell/login-button";
import { QueryNotice } from "../petitions/query-notice";
import { PetitionMarkdownEditor as MarkdownEditor } from "@/components/markdown/markdown-editor";
import { FilingPreview } from "./transaction-preview";
import { byteLength, dueDateValid, validatePetition } from "./validation";
import "./new.css";
export function NewScreen() {
  const snapshot = useOpenpilSnapshot();
  const wallet = useArkivWallet();
  const balance = useWalletBalance(wallet.address);
  const cache = useQueryClient();
  const registry = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? "";
  const courts = registeredCourts(snapshot.data?.records.filter(r => BigInt(r.expiresAt) > BigInt(snapshot.data?.timing.currentBlock ?? "0")) ?? [], registry);
  const [selected, setSelected] = useState("");
  const court = courts.find(c => c.key === selected) ?? courts[0];
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [due, setDue] = useState("");
  const [state, setState] = useState<"idle" | "signing" | "confirmed" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof filePetition>>>();
  const [now, setNow] = useState(() => Date.now());
  const [attempted, setAttempted] = useState(false);
  const [uncertainTx, setUncertainTx] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const busy = state === "signing";
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !wallet.walletClient || !court || balance.blocked || balance.low || uncertain) return;
    setNow(Date.now()); setAttempted(true);
    let values;
    try { values = validatePetition(title, body, due, Date.now()); }
    catch { return; }
    setState("signing"); setError("");
    const notice = toast.loading("Waiting for wallet signature…");
    try {
      const filed = await filePetition(wallet.walletClient, { ...values, court: String(court.attributes.court), filedat: Date.now() }, body, String(court.attributes.wallet) as Address, snapshot.data?.records ?? [], registry);
      setResult(filed); setState("confirmed");
      if (filed.predictionMismatch) setError("The returned entity keys differ from the prediction. Inspect the transaction before filing again.");
      toast.success("Petition filed", { id: notice, action: { label: "Transaction", onClick: () => window.open(txUrl(filed.txHash), "_blank", "noopener,noreferrer") } });
      void cache.invalidateQueries({ queryKey: snapshotKey });
    } catch (failure) {
      const tx = failure && typeof failure === "object" && "txHash" in failure ? String(failure.txHash ?? "") : "";
      const message = failure instanceof Error ? failure.message : "Could not file petition";
      const unknown = !!tx || /timeout|timed out|receipt|network|fetch|transport/i.test(message);
      setUncertainTx(tx); setUncertain(unknown); setState("error"); setError(unknown ? `${message} Submission may have succeeded. Check your wallet activity and refresh Petitions before another filing.${tx ? ` Transaction: ${tx}` : ""}` : message);
      toast.error("Transaction not confirmed", { id: notice, description: message });
    }
  }
  const titleInvalid = byteLength(title.trim()) > 120 || (attempted && !title.trim());
  const dueInvalid = !!due && !dueDateValid(due, now);
  const bodyInvalid = attempted && !body.trim();
  return <div className="new-petition"><header className="page-head"><div>{courts.length === 1 && court && typeof court.payload === "object" && <p className="t-eyebrow">{String(court.payload.name)}</p>}<h1 className="t-display">New petition</h1><p>File a public interest petition to a registered court. It is written to Arkiv from your wallet.</p></div></header>
    {!wallet.address ? <div className="card signcard"><span className="signin-icon"><Wallet size={20} /></span><h2 className="t-h2">Sign in to file a petition</h2><p>Filing writes the petition from your wallet. Sign in with Google, Telegram, X or Discord.</p><LoginButton /></div> : <div className="new-layout"><div>
    {result ? <section className="card filed-card" role="status"><span className="filed-icon"><CircleCheck size={32} /></span><h2 className="t-h2">Petition filed</h2><p>Petition <span className="mono">#{result.petitionKey.slice(2, 8)}</span> is on Arkiv and the court review is open.</p>{result.predictionMismatch && <Notice tone="warn" title="Check the returned record keys">{error}</Notice>}<div className="filed-actions"><Link href={`/petitions/${result.petitionKey}`} className={buttonVariants()}>Open petition</Link>{!result.predictionMismatch && <Button variant="outline" onClick={() => { setResult(undefined); setTitle(""); setBody(""); setDue(""); setState("idle"); setAttempted(false); }}>File another</Button>}<a href={txUrl(result.txHash)} target="_blank" rel="noopener noreferrer">View transaction</a></div></section> : <form className="card newcard" onSubmit={submit}><fieldset disabled={busy}>
    <div><div className="field-label-row"><Label htmlFor="petition-title">Title</Label><small id="title-bytes">{byteLength(title)} / 120 bytes</small></div><Input id="petition-title" required value={title} onChange={e => setTitle(e.target.value)} aria-invalid={titleInvalid} aria-describedby={`title-bytes${titleInvalid ? " title-error" : ""}`} />{titleInvalid && <p className="field-error" id="title-error">{title.trim() ? "Titles are limited to 120 bytes." : "Enter a title."}</p>}</div>
    <div className="new-fields"><div><Label id="court-label">Court</Label><Select disabled={snapshot.isPending || !courts.length} value={court?.key ?? ""} onValueChange={v => setSelected(v ?? "")}><SelectTrigger aria-labelledby="court-label"><SelectValue>{court ? String(court.attributes.court) : snapshot.isPending ? "Loading courts…" : "Choose a registered court"}</SelectValue></SelectTrigger><SelectContent>{courts.map(c => <SelectItem key={c.key} value={c.key}>{String(c.attributes.court)} · {typeof c.payload === "object" ? String(c.payload.name) : "Court"}</SelectItem>)}</SelectContent></Select>{court && <div className="registered-court"><StatusBadge tone="seal" size="sm" /><AddressChip address={String(court.attributes.wallet)} /></div>}</div><div><Label htmlFor="petition-due">Review due date</Label><Input id="petition-due" type="date" required value={due} onChange={e => { setNow(Date.now()); setDue(e.target.value); }} aria-invalid={dueInvalid} aria-describedby={dueInvalid ? "due-helper due-error" : "due-helper"} /><small id="due-helper">The court decides by this date or the petition expires.</small>{dueInvalid && <p id="due-error" className="field-error">Choose a date after today.</p>}</div></div>
    <div><Label htmlFor="petition-body">Petition</Label><MarkdownEditor value={body} onChange={setBody} disabled={busy} invalid={bodyInvalid} />{bodyInvalid && <p className="field-error">Write a petition body.</p>}</div>
    <QueryNotice error={snapshot.error} retry={snapshot.refetch} />{!snapshot.isPending && !courts.length && <Notice title="No registered court is available yet." />}
    <BalanceNotice address={wallet.address} />{wallet.error && <Notice tone="error" title="Wallet unavailable">{wallet.error.message}</Notice>}
    {error && <Notice tone={uncertain ? "warn" : "error"} title={uncertain ? "We could not confirm the filing" : "Could not file petition"} action={uncertain ? <Button type="button" size="sm" variant="outline" onClick={() => void cache.invalidateQueries({ queryKey: snapshotKey })}>Refresh petitions</Button> : undefined}>{error}{uncertainTx && <a href={txUrl(uncertainTx)} target="_blank" rel="noopener noreferrer">View transaction</a>}</Notice>}
    <div className="new-submit"><p>One signature. Gas paid in GLM.</p><Button size="lg" type="submit" disabled={!wallet.walletClient || !court || balance.blocked || balance.low || busy || uncertain || byteLength(title.trim()) > 120 || byteLength(body) > 32768 || dueInvalid}>{busy ? "Waiting for wallet…" : "Sign and file petition"}</Button></div></fieldset></form>}
    </div><FilingPreview title={title} court={String(court?.attributes.court ?? "")} wallet={court ? String(court.attributes.wallet) : undefined} bytes={byteLength(body)} due={due} state={state} tx={result?.txHash} /></div>}
  </div>;
}
