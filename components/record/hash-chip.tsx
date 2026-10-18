"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { addressUrl, entityUrl, txUrl } from "@/lib/arkiv/chain";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
export function HashChip({ value, kind, full = false, copy = true }: { value: string; kind: "address" | "entity" | "tx"; full?: boolean; copy?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copyValue() {
    try { await navigator.clipboard.writeText(value); setCopied(true); setFailed(false); clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 2000); }
    catch { setFailed(true); }
  }
  const url = { address: addressUrl, entity: entityUrl, tx: txUrl }[kind](value);
  return <span className="hash-chip" data-full={full}><Tooltip><TooltipTrigger render={<a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${kind} ${value} on Arkiv Explorer (opens in new tab)`} />}>{full ? value : `${value.slice(0, 6)}…${value.slice(-4)}`}</TooltipTrigger><TooltipContent><span className="font-mono break-all">{value}<span className="block font-sans text-[var(--text-disabled)]">Open in Arkiv Explorer</span></span></TooltipContent></Tooltip>{copy && <Tooltip><TooltipTrigger render={<button type="button" onClick={() => void copyValue()} aria-label={copied ? "Copied" : `Copy ${kind}`} />}>{copied ? <Check size={12} color="var(--ok)" /> : <Copy size={12} />}</TooltipTrigger><TooltipContent>{failed ? "Could not copy. Select the address in Explorer." : copied ? "Copied" : `Copy ${kind}`}</TooltipContent></Tooltip>}<span className="sr-only" role="status">{copied ? "Copied" : failed ? "Could not copy" : ""}</span></span>;
}
