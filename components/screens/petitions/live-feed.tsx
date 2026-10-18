"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ExternalLink, Loader2 } from "lucide-react";
import { isRateLimited } from "@/lib/arkiv/retry";
import { FeedRetry } from "./feed-retry";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { snapshotKey, useOpenpilSnapshot } from "@/hooks/use-openpil-snapshot";

import { txUrl } from "@/lib/arkiv/chain";
import { mergeFeedItems, type FeedItem } from "./feed-items";
export function LiveFeed({ wallets }: { wallets: string[] }) {
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [retryAt, setRetryAt] = useState<number>();
  const client = useQueryClient();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [state, setState] = useState("Connecting");
  const owners = useRef(new Set<string>());
  useEffect(() => { owners.current = new Set(wallets.map(w => w.toLowerCase())); }, [wallets]);
  useEffect(() => {
    let active = true;
    let attemptedReconnect = false;
    let failed = false;
    let stop: (() => void) | undefined;
    let close: (() => void) | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const queue = new Map<string, { tx: string; type: string }>();
    const flush = async () => {
      timer = undefined;
      const batch = [...queue]; queue.clear();
      try {
        // Reuse fresh data; events never cause per-entity HTTP reads.
        const snapshot = await client.fetchQuery<NonNullable<ReturnType<typeof useOpenpilSnapshot>["data"]>>({ queryKey: snapshotKey, staleTime: 0 });
        if (!active) return;
        const additions = batch.flatMap(([key, event]) => {
          const record = snapshot.records.find(r => r.key === key);
          const type = String(record?.attributes.type);
          if (!record || !["petition", "decision", "extension"].includes(type)) return [];
          return [{ id: `${key}-${event.tx}`, key: type === "petition" ? key : String(record.attributes.petition), label: event.type === "ExpiryExtended" ? "Record kept alive" : event.type === "EntityPatched" ? "Record updated" : type === "petition" ? "Petition filed" : type === "decision" ? String(record.attributes.outcome) === "accepted" ? "Accepted" : "Rejected" : "Review extended", tx: event.tx }];
        });
        setItems(old => mergeFeedItems(additions, old));
      } catch (error) { fail(error); }
    };
    function fail(error?: unknown) {
      if (!active || failed) return;
      failed = true;
      setState(isRateLimited(error) ? "Paused, rate limited" : "Disconnected");
      stop?.(); close?.();
      if (timer) clearTimeout(timer);
      if (!attemptedReconnect) {
        attemptedReconnect = true;
        setRetryAt(Date.now() + 30000);
        retryTimer = setTimeout(() => void connect(), 30000);
      }
    }
    async function connect() {
      failed = false;
      setRetryAt(undefined);
      setState("Connecting");
      try {
        const { createWebSocketClient } = await import("@/lib/arkiv/clients");
        if (!active) return;
        const ws = createWebSocketClient();
        const socket = await ws.transport.getRpcClient();
        if (!active) { socket.close(); return; }
        close = () => socket.close();
        setState("Live");
        stop = ws.watchEntityEvents({ onEvent(event) {
          if (!active) return;
          setState("Live");
          if (!(owners.current.has(("owner" in event ? String(event.owner) : "").toLowerCase()) || owners.current.has(("newOwner" in event ? String(event.newOwner) : "").toLowerCase()))) return;
          if (queue.size >= 10 && !queue.has(event.entityKey)) return;
          queue.set(event.entityKey, { tx: event.transactionHash, type: event.type });
          if (!timer) timer = setTimeout(() => void flush(), 60000);
        }, onError: fail });
      } catch (error) { fail(error); }
    }
    void connect();
    return () => { active = false; stop?.(); close?.(); if (timer) clearTimeout(timer); if (retryTimer) clearTimeout(retryTimer); };
  }, [client]);
  return <section className="panel deadline-feed" data-expanded={expanded} aria-label="Live activity">
    <button className="feed-disclosure panel-head" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>Live activity<ChevronDown size={16} /></button>
    <div className="feed-content"><div className="panel-head"><h2 className="t-h4">Live activity</h2><span className="feed-connection t-xs" data-state={state} role="status">{state === "Connecting" ? <Loader2 size={12} className="animate-spin" /> : <i />}{state}</span></div>
    {retryAt && <FeedRetry deadline={retryAt} />}
    <ol aria-live="polite" aria-relevant="additions"><AnimatePresence initial={false}>{items.slice(0, 8).map(item => <motion.li key={item.id} initial={reduced ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .32 }} className="feed-event"><i data-kind={item.label} /><div><p>{item.label}</p><div className="feed-links"><Link className="mono" href={`/petitions/${item.key}`}>#{item.key.slice(2, 8)}</Link><a href={txUrl(item.tx)} target="_blank" rel="noopener noreferrer">Transaction <ExternalLink size={12} /></a></div></div></motion.li>)}</AnimatePresence></ol>
    {!items.length && <p className="feed-empty">New filings and decisions appear here as they happen.</p>}
    <div className="feed-footer">Streaming entity events from Arkiv Tiramisu</div></div>
  </section>;
}
