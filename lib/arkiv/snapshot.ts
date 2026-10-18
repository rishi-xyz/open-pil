import type { ArkivRecord } from "./records";
import type { BlockTiming } from "../time";
export type OpenpilSnapshot = { records: ArkivRecord[]; timing: BlockTiming };
export function snapshotOrgs(records: ArkivRecord[], registry: string) {
  return records.filter(r => r.attributes.type === "org" && r.creator.toLowerCase() === registry.toLowerCase());
}
export { registeredCourts } from "./trust/revision3";
import { derivePetition, registeredCourts } from "./trust/revision3";
export function snapshotPetitions(records: ArkivRecord[], registry: string, timing: BlockTiming) {
  const live = records.filter(r => BigInt(r.expiresAt) > BigInt(timing.currentBlock));
  const courts = registeredCourts(live, registry);
  return live.filter(r => r.attributes.type === "petition").map(p => derivePetition(p, live.filter(r => String(r.attributes.petition).toLowerCase() === p.key.toLowerCase()), courts, timing)).sort((a, b) => b.filedAt - a.filedAt || a.petition.key.localeCompare(b.petition.key));
}
export function snapshotPetition(records: ArkivRecord[], key: string, registry: string, timing: BlockTiming) {
  return snapshotPetitions(records, registry, timing).find(row => row.petition.key.toLowerCase() === key.toLowerCase());
}
export function petitionBuckets(rows: ReturnType<typeof snapshotPetitions>) {
  return { all: rows, underReview: rows.filter(r => r.status === "under-review"), accepted: rows.filter(r => r.status === "accepted"), rejected: rows.filter(r => r.status === "rejected"), expired: rows.filter(r => r.status === "expired"), incomplete: rows.filter(r => r.status === "review-incomplete") };
}
