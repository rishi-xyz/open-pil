import type { ReactNode } from "react";
import { HashChip } from "./hash-chip";
export type TimelineVariant = "event" | "adjourn" | "open" | "missed" | "answered" | "late";
export function TimelineItem({ variant = "event", title, when, txHash, children }: { variant?: TimelineVariant; title: string; when: ReactNode; txHash?: string; children?: ReactNode }) { return <li className={`tl-item ${variant}`}><span className="tl-mark" aria-hidden="true" /><div><div className="tl-when">{when}</div><h3 className="tl-title">{title}</h3><div className="tl-body">{children}</div>{txHash && <div className="tl-meta"><span>Transaction <HashChip value={txHash} kind="tx" /></span></div>}</div></li>; }
