"use client";
import { useEffect, useState } from "react";
import { isRateLimited, retryDelay } from "@/lib/arkiv/retry";
import { RateLimitedNotice } from "@/components/record/rate-limited-notice";
import { Notice } from "@/components/record/notice";
import { Button } from "@/components/ui/button";
export function QueryNotice({ error, failures = 0, updatedAt = 0, retry }: { error: unknown; failures?: number; updatedAt?: number; retry: () => unknown }) {
  const [remaining, setRemaining] = useState(60);
  useEffect(() => {
    if (!isRateLimited(error)) return;
    const deadline = (updatedAt || Date.now()) + retryDelay(Math.max(0, failures - 1), error);
    const id = setInterval(() => setRemaining(Math.max(0, (deadline - Date.now()) / 1000)), 1000);
    return () => clearInterval(id);
  }, [error, failures, updatedAt]);
  if (!error) return null;
  if (isRateLimited(error)) return <RateLimitedNotice retryInSeconds={remaining} action={<Button size="sm" variant="outline" onClick={() => void retry()}>Retry now</Button>} />;
  return <Notice tone="error" title="Could not load records from Arkiv." action={<Button size="sm" variant="outline" onClick={() => void retry()}>Try again</Button>}>{error instanceof Error ? error.message : String(error)}</Notice>;
}
