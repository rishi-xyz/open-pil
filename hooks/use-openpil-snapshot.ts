"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { eq } from "@arkiv-network/sdk/query";
import { publicClient } from "@/lib/arkiv/clients";
import { serializePage } from "@/lib/arkiv/records";
import { readSnapshotCache, saveSnapshotCache } from "@/lib/arkiv/snapshot-cache";
export const snapshotKey = ["openpil-snapshot"] as const;
export function useOpenpilSnapshot() {
  const [cached] = useState(readSnapshotCache);
  return useQuery({ queryKey: snapshotKey, initialData: cached?.snapshot, initialDataUpdatedAt: cached?.savedAt, staleTime: 20000, gcTime: 600000, queryFn: async () => {
    let page = await publicClient.select("*").where(eq("app", "openpil")).limit(200).fetch();
    const records = [...serializePage(page.entities).records];
    while (page.hasNextPage()) {
      page = await page.next();
      records.push(...serializePage(page.entities).records);
    }
    const timing = await publicClient.getBlockTiming();
    const snapshot = { records, timing: { ...timing, currentBlock: timing.currentBlock.toString() } };
    saveSnapshotCache(snapshot);
    return snapshot;
  } });
}
// Page-shaped views keep loading and error state attached to the single shared request.
export function useSnapshotRecords(select: (records: NonNullable<ReturnType<typeof useOpenpilSnapshot>["data"]>["records"]) => NonNullable<ReturnType<typeof useOpenpilSnapshot>["data"]>["records"]) {
  const query = useOpenpilSnapshot();
  return { ...query, data: query.data ? { pages: [{ records: select(query.data.records) }] } : undefined, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: query.refetch };
}
export function useSnapshotTiming() {
  const query = useOpenpilSnapshot();
  return { ...query, data: query.data?.timing };
}
