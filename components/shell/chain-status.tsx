"use client";
import { useSnapshotTiming } from "@/hooks/use-openpil-snapshot";
import { ClientReady } from "./client-ready";
import { BlockTicker } from "@/components/motion/block-ticker";
function SnapshotStatus() {
  const timing = useSnapshotTiming();
  return <BlockTicker height={timing.data?.currentBlock} stale={timing.isFetching || timing.isError} />;
}

export function ChainStatus() { return <ClientReady fallback={<BlockTicker />}><SnapshotStatus /></ClientReady>; }
