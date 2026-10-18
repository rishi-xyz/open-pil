"use client";
import { useReducedMotion } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
export function BlockTicker({ height, stale = false }: { height?: string; stale?: boolean }) {
  const reduced = useReducedMotion();
  return <Tooltip><TooltipTrigger render={<div className="chainstat" tabIndex={0} data-stale={stale} data-unavailable={!height} />}><span className="pulse" aria-hidden="true" /><span className="net">Tiramisu</span><span className="ticker" aria-label={height ? `Block ${height}` : "Block height unavailable"}>#{height ? Array.from(height, (digit, i) => <span className="d" key={i}><span key={digit} style={{ animation: reduced ? "none" : undefined }}>{digit}</span></span>) : <span className="ticker-unavailable">unavailable</span>}</span></TooltipTrigger><TooltipContent>{stale ? "Last observed block. Refreshing." : "Latest block in the shared Arkiv snapshot"}</TooltipContent></Tooltip>;
}
