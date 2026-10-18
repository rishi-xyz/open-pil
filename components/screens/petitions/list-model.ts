import type { ArkivRecord } from "@/lib/arkiv/records";
import type { snapshotPetitions } from "@/lib/arkiv/snapshot";
export type PetitionRow = Omit<ReturnType<typeof snapshotPetitions>[number], "review" | "decision"> & { review?: ArkivRecord; decision?: ArkivRecord };
export const statusLabels = { "under-review": "Under review", accepted: "Accepted", rejected: "Rejected", expired: "Expired", "review-incomplete": "Review incomplete" };
export type Filter = "all" | PetitionRow["status"];
export function filterPetitions(rows: PetitionRow[], status: Filter, court: string, search: string) {
  const query = search.trim().toLocaleLowerCase();
  return rows.filter(r => (status === "all" || r.status === status) && (!court || r.petition.attributes.court === court) && String(r.petition.attributes.title).toLocaleLowerCase().includes(query));
}
export function reviewFraction(row: PetitionRow, now: number) {
  if (row.status === "expired" || row.decision) return 1;
  const duration = row.due - row.filedAt;
  if (duration <= 0) return 0;
  return Math.min(1, Math.max(0, (row.due - now) / duration));
}
export const short = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;
export const date = (value: number) => Number.isFinite(value) && value > 0 ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(value) : "Unknown";
