"use client";
import { Check, X, TriangleAlert, CircleDashed, Loader2, Minus } from "lucide-react";
export type CheckState = "waiting" | "pending" | "ok" | "warn" | "fail" | "skipped";
export type CheckStep = { label: string; detail?: string; state: CheckState };
const icons = { waiting: CircleDashed, pending: Loader2, ok: Check, warn: TriangleAlert, fail: X, skipped: Minus };
export function CheckSequence({ steps }: { steps: CheckStep[] }) {
  return <ol className="check-sequence">{steps.map(step => { const Icon = icons[step.state]; return <li key={step.label} data-state={step.state}><span className="check-icon" aria-hidden="true"><Icon key={step.state} className={step.state === "pending" ? "animate-spin" : "check-resolved"} /></span><div><strong>{step.label}</strong><p>{step.state === "skipped" ? "Not applicable" : step.detail ?? step.state}</p></div></li>; })}</ol>;
}
