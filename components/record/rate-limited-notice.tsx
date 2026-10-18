import type { ReactNode } from "react";
import { Notice } from "./notice";
export function RateLimitedNotice({ retryInSeconds, retryAfterSeconds = 60, action }: { retryInSeconds: number; retryAfterSeconds?: number; action?: ReactNode }) {
  const seconds = Math.max(0, Math.ceil(retryInSeconds));
  const fraction = Math.min(1, seconds / Math.max(1, retryAfterSeconds));
  return <Notice tone="warn" title="Arkiv's public RPC is rate limiting requests." action={action} icon={<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="var(--warn-border)" strokeWidth="2.5" /><circle cx="12" cy="12" r="9" fill="none" stroke="var(--warn)" strokeWidth="2.5" strokeDasharray={`${fraction * 56.55} 56.55`} transform="rotate(-90 12 12)" /></svg>}>Retrying in {seconds} s. Loaded records stay visible.</Notice>;
}
