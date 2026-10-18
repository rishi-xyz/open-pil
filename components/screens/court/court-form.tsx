"use client";
import { useRef, useState } from "react";
import type { Hex } from "viem";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { snapshotKey } from "@/hooks/use-openpil-snapshot";
import { txUrl } from "@/lib/arkiv/chain";
import { dateLabel, extensionValid, reasonValid, type PetitionState } from "@/components/screens/petition/presentation";
import { submitCourtAction } from "./court-client";
// Same form logic as the former wallet court panel, posted to the server signer instead of a browser wallet.
export function CourtForm({ state, onDone }: { state: PetitionState; onDone?: () => void }) {
  const cache = useQueryClient();
  const lock = useRef(false);
  const cancel = useRef<HTMLButtonElement>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"decide" | "extend">("decide");
  const [outcome, setOutcome] = useState<"accepted" | "rejected">("accepted");
  const [reason, setReason] = useState("");
  const [due, setDue] = useState("");
  const petition = state.petition.key as Hex;
  async function run(action: () => Promise<{ txHash: string }>, title: string) {
    if (lock.current || busy) return;
    lock.current = true; setBusy(true);
    const id = toast.loading("The demo court is signing…");
    try {
      const result = await action();
      toast.success(title, { id, description: <a href={txUrl(result.txHash)} target="_blank" rel="noopener noreferrer">View transaction</a> });
      await cache.invalidateQueries({ queryKey: snapshotKey });
      onDone?.();
    } catch (failure) { toast.error("Court action not recorded", { id, description: failure instanceof Error ? failure.message : "The court action failed." }); }
    finally { lock.current = false; setBusy(false); }
  }
  async function recordDecision() {
    if (busy || !reasonValid(reason)) return;
    setConfirm(false);
    await run(() => submitCourtAction("decide", { petition, outcome, reason }), "Decision recorded");
  }
  const submitDisabled = busy || !reasonValid(reason) || (mode === "extend" && !extensionValid(due, state.due));
  return <><div className="court-form"><div className="petition-buttons"><Button variant={mode === "decide" ? "outline" : "ghost"} disabled={busy} aria-pressed={mode === "decide"} onClick={() => setMode("decide")}>Decide</Button><Button variant={mode === "extend" ? "outline" : "ghost"} disabled={busy} aria-pressed={mode === "extend"} onClick={() => setMode("extend")}>Extend deadline</Button></div><form onSubmit={event => {
    event.preventDefault();
    if (submitDisabled) return;
    if (mode === "decide") { setConfirm(true); return; }
    void run(() => submitCourtAction("extend", { petition, due: Date.parse(due), reason }), "Review extended");
  }}>{mode === "decide" ? <fieldset disabled={busy}><legend className="t-field">Outcome</legend>{(["accepted", "rejected"] as const).map(item => <label key={item}><input type="radio" name={`outcome-${state.petition.key}`} value={item} checked={outcome === item} onChange={() => setOutcome(item)} /><span>{item === "accepted" ? "Accept" : "Reject"}<small>{item === "accepted" ? "The petition is admitted." : "The petition is dismissed."}</small></span></label>)}</fieldset> : <div><Label htmlFor={`extension-due-${state.petition.key}`}>New due date</Label><Input id={`extension-due-${state.petition.key}`} type="datetime-local" value={due} onChange={event => setDue(event.target.value)} disabled={busy} required aria-invalid={!!due && !extensionValid(due, state.due)} aria-describedby={`extension-helper-${state.petition.key}`} /><small id={`extension-helper-${state.petition.key}`}>Must be after {dateLabel(state.due)}.</small></div>}<Label htmlFor={`court-reason-${state.petition.key}`}>Reason</Label><MarkdownEditor id={`court-reason-${state.petition.key}`} label="Reason" value={reason} onChange={setReason} disabled={busy} /><p className="t-small">{mode === "decide" ? "One transaction records the decision and closes the review. The reason is public." : `This will be extension ${state.extensions.length + 1}. The reason is public.`}</p><Button className="court-submit" size="lg" variant={mode === "decide" && outcome === "rejected" ? "destructive" : "default"} type="submit" disabled={submitDisabled}>{busy ? "Signing on the server…" : mode === "extend" ? "Extend review" : outcome === "accepted" ? "Record decision" : "Record rejection"}</Button></form></div>
    <Dialog open={confirm} onOpenChange={setConfirm}><DialogContent initialFocus={cancel}><DialogTitle>{outcome === "accepted" ? "Record decision" : "Record rejection"}</DialogTitle><DialogDescription>This records the petition as {outcome === "accepted" ? "Accepted" : "Rejected"} on Arkiv, signed by the demo court key, and closes the review. It cannot be changed afterwards.</DialogDescription><DialogFooter><Button ref={cancel} variant="outline" onClick={() => setConfirm(false)}>Cancel</Button><Button disabled={busy} variant={outcome === "rejected" ? "destructive" : "default"} onClick={() => void recordDecision()}>{outcome === "accepted" ? "Sign and record" : "Sign and reject"}</Button></DialogFooter></DialogContent></Dialog></>;
}
