"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useOpenpilSnapshot } from "@/hooks/use-openpil-snapshot";
import { snapshotPetitions } from "@/lib/arkiv/snapshot";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { SlidingTabIndicator } from "@/components/motion/sliding-tab-indicator";
import { SearchX, Search, X } from "lucide-react";
import { SkeletonRows } from "@/components/record/skeleton-rows";
import { Skeleton } from "@/components/ui/skeleton";
import { filterPetitions, statusLabels, type Filter } from "./list-model";
import { PetitionListRow } from "./petition-row";
import { QueryNotice } from "./query-notice";
import { LiveFeed } from "./live-feed";
import "./petitions.css";
const statuses = ["under-review", "accepted", "rejected", "expired"] as const;
export function PetitionsScreen() {
  const query = useOpenpilSnapshot();
  const searchInput = useRef<HTMLInputElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const node = tabs.current;
    if (!node) return;
    const update = () => setOverflow(node.scrollWidth > node.clientWidth && node.scrollLeft + node.clientWidth < node.scrollWidth - 1);
    const observer = new ResizeObserver(update);
    observer.observe(node); node.addEventListener("scroll", update); update();
    return () => { observer.disconnect(); node.removeEventListener("scroll", update); };
  }, []);
  const [status, setStatus] = useState<Filter>("all");
  const [court, setCourt] = useState("");
  const [search, setSearch] = useState("");
  const rows = query.data ? snapshotPetitions(query.data.records, process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? "", query.data.timing) : [];
  const filtered = filterPetitions(rows, status, court, search);
  const courts = [...new Set(rows.map(row => String(row.petition.attributes.court)))];
  const filters: Filter[] = ["all", ...statuses, ...(rows.some(r => r.status === "review-incomplete") ? ["review-incomplete" as const] : [])];
  return <div className="petitions-v3">
    <header className="page-head"><div><h1 className="t-display">Petitions</h1><p>Filed to registered courts and read live from Arkiv.</p></div><Link href="/new" className={buttonVariants()}>New petition</Link></header>
    <div className="tiles" aria-label="Petitions by status">{statuses.map(s => {
      const next = s === "under-review" ? Math.min(...rows.filter(r => r.status === s).map(r => r.due)) : Infinity;
      return <div key={s} className={`tile t-${s}`}><span className="tile-label"><i />{statusLabels[s]}</span><strong className="t-stat">{query.data ? rows.filter(r => r.status === s).length : <Skeleton className="h-8 w-10" />}</strong><span className="t-small">{s === "under-review" ? "Awaiting a court decision" : s === "expired" ? "No decision by the due date" : "Decision recorded"}</span>{Number.isFinite(next) && <span className="t-small" data-soon={next - (query.data?.timing.currentBlockTime ?? 0) * 1000 <= 3 * 86400000}>Next due {new Date(next).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}</span>}</div>;
    })}</div>
    <div className="list-layout"><section aria-label="Petitions"><div ref={tabs} data-overflow={overflow} className="petition-tabs" role="group" aria-label="Status">{filters.map(s => <button key={s} aria-pressed={status === s} onClick={event => { setStatus(s); event.currentTarget.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "auto" }); }}>{s === "all" ? "All" : statusLabels[s]} <span className="tab-count">{query.data ? rows.filter(r => s === "all" || r.status === s).length : <Skeleton className="h-3 w-3" />}</span>{status === s && <SlidingTabIndicator id="petition-status" />}</button>)}</div>
    <div className="toolbar"><div className="petition-search"><Search size={16} aria-hidden="true" /><Input ref={searchInput} aria-label="Search by title" placeholder="Search by title" value={search} onChange={e => setSearch(e.target.value)} />{search && <Button size="icon-sm" variant="ghost" aria-label="Clear search" onClick={() => { setSearch(""); searchInput.current?.focus(); }}><X size={14} /></Button>}</div><Select value={court} onValueChange={v => setCourt(v ?? "")}><SelectTrigger aria-label="Filter by court"><SelectValue>{court || "All courts"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="">All courts</SelectItem>{courts.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
    <QueryNotice error={query.error} failures={query.failureCount} updatedAt={query.errorUpdatedAt} retry={query.refetch} />
    <div className="plist"><div className="plist-head" aria-hidden="true"><span>No.</span><span>Petition</span><span>Status</span><span>Dates</span><span>Review period</span></div>
    {query.isPending ? <SkeletonRows /> : filtered.map((row, index) => <PetitionListRow key={row.petition.key} row={row} index={index} now={(query.data?.timing.currentBlockTime ?? 0) * 1000} />)}
    {query.data && !filtered.length && <div className="empty"><span className="empty-icon"><SearchX size={20} /></span><h2 className="t-h3">{!rows.length && status === "all" && !court && !search ? "No petitions yet" : "No petitions match these filters"}</h2><p>{!rows.length ? "Filed petitions appear here once they are on Arkiv." : "Try another status or court, or clear the search."}</p>{!rows.length && status === "all" && !court && !search ? <Link href="/new" className={buttonVariants()}>New petition</Link> : <Button size="sm" variant="outline" onClick={() => { setSearch(""); setCourt(""); setStatus("all"); }}>Clear filters</Button>}</div>}
    </div></section><aside className="feedcol"><LiveFeed wallets={query.data?.records.flatMap(r => [r.creator, r.owner]) ?? []} /></aside></div>
  </div>;
}
