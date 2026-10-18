"use client";
import { Notice } from "./notice";
import { RateLimitedNotice } from "./rate-limited-notice";
import { Button } from "@/components/ui/button";
export function QueryNotice({ error, retryInSeconds, onRetry, retrying = false }: { error?: Error | null; retryInSeconds?: number; onRetry: () => void; retrying?: boolean }) {
  if (retryInSeconds !== undefined) return <RateLimitedNotice retryInSeconds={retryInSeconds} action={<Button variant="outline" size="sm" loading={retrying} onClick={onRetry}>Retry now</Button>} />;
  if (!error) return null;
  return <Notice tone="error" title="Could not load records from Arkiv." action={<Button variant="outline" size="sm" loading={retrying} onClick={onRetry}>Try again</Button>}>{error.message}</Notice>;
}
