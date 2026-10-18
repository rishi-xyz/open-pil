"use client";
import { useState } from "react";
import Link from "next/link";
import { CircleAlert, Gavel } from "lucide-react";
import { useOpenpilSnapshot } from "@/hooks/use-openpil-snapshot";
import { snapshotPetitions } from "@/lib/arkiv/snapshot";
import { sameAddress } from "@/lib/arkiv/trust/rules";
import { AddressChip } from "@/components/record/address-chip";
import { Notice } from "@/components/record/notice";
import { StatusBadge } from "@/components/record/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { PetitionsLoading } from "@/components/screens/petitions/loading";
import { dateLabel } from "@/components/screens/petition/presentation";
import { CourtForm } from "./court-form";
import "./court.css";
export function CourtScreen({ court }: { court?: string }) {
  const query = useOpenpilSnapshot();
  const [open, setOpen] = useState<string>();
  if (query.isPending) return <PetitionsLoading />;
  if (query.isError || !query.data) return <div className="petition-result" role="alert"><span className="result-icon error"><CircleAlert size={24} /></span><h1 className="t-h2">Could not read petitions</h1><p>{query.error?.message ?? "Arkiv is unavailable."}</p><Button onClick={() => void query.refetch()}>Try again</Button></div>;
  const { records, timing } = query.data;
  const rows = snapshotPetitions(records, process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? "", timing).filter(row => row.status === "under-review" && row.review && court && sameAddress(row.review.owner, court));
  const now = timing.currentBlockTime * 1000;
  return <div className="court-screen"><header className="page-head"><div><p className="t-eyebrow"><Gavel size={14} aria-hidden="true" /> Demo court</p><h1 className="t-display">Court desk</h1><p>Petitions under review by the demo court. Anyone may accept, reject or extend one; the server signs with the court key.</p></div></header>
    <Notice tone="warn" title="Public demonstration. No login, no real authority.">Every visitor acts as the same synthetic court{court && <> <AddressChip address={court} /></>}. Decisions and extensions are written to Arkiv Tiramisu and are public and permanent for the life of the record. Use synthetic reasons only.</Notice>
    {!court && <Notice tone="error" title="The demo court is not configured">This deployment has no court signing key, so no action can be recorded.</Notice>}
    <section className="court-list" aria-label="Petitions under review">{rows.length === 0 ? <div className="card card-pad court-empty"><h2 className="t-h3">No petitions await the demo court</h2><p>Under review petitions appear here as soon as they are filed.</p><Link href="/new" className={buttonVariants({ variant: "outline" })}>File a petition</Link></div> : rows.map(row => {
      const days = Math.max(0, Math.ceil((row.due - now) / 86400000));
      const active = open === row.petition.key;
      return <article key={row.petition.key} className="panel court-case" data-open={active}><div className="panel-head"><div className="court-case-title"><span className="petition-number">#{row.petition.key.slice(2, 8)}</span><h2 className="t-h4"><Link href={`/petitions/${row.petition.key}`}>{String(row.petition.attributes.title)}</Link></h2></div><StatusBadge tone="review">Under review</StatusBadge></div><div className="panel-body"><dl className="court-case-meta"><div><dt>Petitioner</dt><dd><AddressChip address={row.petition.creator} /></dd></div><div><dt>Court code</dt><dd>{String(row.petition.attributes.court)}</dd></div><div><dt>Due</dt><dd>{dateLabel(row.due)}<small>{days === 0 ? "Due today" : `${days} days left`}{row.extensions.length > 0 && `, extended ${row.extensions.length === 1 ? "once" : `${row.extensions.length} times`}`}</small></dd></div></dl>{active ? <CourtForm state={row} onDone={() => setOpen(undefined)} /> : <div className="petition-buttons"><Button variant="outline" disabled={!court} onClick={() => setOpen(row.petition.key)}>Review this petition</Button><Link href={`/petitions/${row.petition.key}`} className={buttonVariants({ variant: "ghost" })}>Read the petition</Link></div>}</div></article>;
    })}</section></div>;
}
