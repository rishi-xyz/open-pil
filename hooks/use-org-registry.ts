"use client";
import { useSnapshotRecords } from "./use-openpil-snapshot";
import { snapshotOrgs } from "@/lib/arkiv/snapshot";
export function useOrgRegistry() {
  return useSnapshotRecords(records => snapshotOrgs(records, process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? ""));
}
