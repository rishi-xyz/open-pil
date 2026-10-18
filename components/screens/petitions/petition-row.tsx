"use client";
import { StatusBadge } from "@/components/record/status-badge";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { date, reviewFraction, short, statusLabels, type PetitionRow } from "./list-model";
export function PetitionListRow({ row, now, index }: { row: PetitionRow; now: number; index: number }) {
  const reduced = useReducedMotion();
  const soon = row.status === "under-review" && row.due - now <= 3 * 86400000;
  const days = Math.max(0, Math.ceil((row.due - now) / 86400000));
  return <article className="prow">
    <span className="pid mono">#{row.petition.key.slice(2, 8)}</span>
    <h2 className="p-title"><Link href={`/petitions/${row.petition.key}`}>{String(row.petition.attributes.title)}</Link></h2>
    <div className="p-meta"><span>Filed by <span className="mono" title={row.petition.creator}>{short(row.petition.creator)}</span></span><StatusBadge size="sm">{String(row.petition.attributes.court)}</StatusBadge></div>
    <div className="p-status"><StatusBadge tone={row.status === "under-review" ? "review" : row.status === "review-incomplete" ? "incomplete" : row.status}>{statusLabels[row.status]}</StatusBadge>{row.late && <StatusBadge tone="late" />}</div>
    <div className="p-dates"><span>Filed <b>{date(row.filedAt)}</b></span><span>{row.decision ? "Decided" : "Due"} <b>{date(row.decidedAt ?? row.due)}</b></span></div>
    <div className="p-bar"><span className={`rbar ${row.status} ${soon ? "soon" : ""} ${row.late ? "late" : ""}`} aria-hidden="true" style={row.late && row.decidedAt ? { "--due-position": `${Math.max(0, Math.min(100, (row.due - row.filedAt) / Math.max(1, row.decidedAt - row.filedAt) * 100))}%` } as React.CSSProperties : undefined}><motion.i initial={reduced ? false : { scaleX: 0 }} animate={{ scaleX: reviewFraction(row, now) }} transition={{ duration: reduced ? 0 : 1.1, delay: reduced ? 0 : index * .05 }} /></span><span>{row.status === "under-review" ? days === 0 ? "Due today" : `${days} days left` : row.late ? "Decided late" : row.decision ? "Decided on time" : statusLabels[row.status]}</span></div>
  </article>;
}
