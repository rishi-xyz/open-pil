import type { ReactNode } from "react";
import { Check, Clock, X } from "lucide-react";
export type BadgeTone = "review" | "accepted" | "rejected" | "expired" | "incomplete" | "late" | "seal" | "neutral" | "verified" | "warn" | "missed";
export function StatusBadge({ tone = "neutral", children, size = "default" }: { tone?: BadgeTone; children?: ReactNode; size?: "sm" | "default" | "md" }) {
  const resolved = tone === "verified" ? "accepted" : tone === "warn" ? "incomplete" : tone === "missed" ? "rejected" : tone;
  return <span className="status-badge" data-tone={resolved} data-size={size}>{resolved === "review" ? <span className="review-dot" aria-hidden="true" /> : resolved === "accepted" ? <Check aria-hidden="true" /> : resolved === "rejected" ? <X aria-hidden="true" /> : resolved === "expired" || resolved === "incomplete" ? <Clock aria-hidden="true" /> : resolved === "seal" ? <svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" /><circle cx="7" cy="7" r="3.6" fill="none" stroke="currentColor" /><circle cx="7" cy="7" r="1.3" fill="currentColor" /></svg> : null}{children ?? (resolved === "late" ? "Decided late" : resolved === "seal" ? "Registered" : undefined)}</span>;
}
