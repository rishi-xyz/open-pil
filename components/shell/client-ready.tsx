"use client";
import { useSyncExternalStore, type ReactNode } from "react";
const subscribe = () => () => {};
const client = () => true;
const server = () => false;
// Browser-cached snapshots and wallet state must not change the hydration render.
export function ClientReady({ children, fallback = null }: { children?: ReactNode; fallback?: ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, client, server);
  return mounted ? children : fallback;
}
