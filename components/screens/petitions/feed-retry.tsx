"use client";
import { useEffect, useState } from "react";
export function FeedRetry({ deadline }: { deadline: number }) {
  const [remaining, setRemaining] = useState(30);
  useEffect(() => {
    const tick = () => { if (!document.hidden) setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))); };
    tick();
    const id = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [deadline]);
  return <p className="feed-retry" role="status"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="var(--warn-border)" strokeWidth="2" /><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - remaining / 30} /></svg><span>{remaining ? `Retrying connection in ${remaining} s. Loaded records remain visible.` : "Reconnecting to Arkiv…"}</span></p>;
}
