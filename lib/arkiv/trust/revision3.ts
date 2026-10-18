import type { ArkivRecord } from "../records";
import { blockToTime, type BlockTiming } from "../../time";
import { addressSchema } from "../model";
import { isType, sameAddress } from "./rules";
export function registeredCourts(records: ArkivRecord[], registry: string) {
  return records.filter(r => isType(r, "org") && sameAddress(r.creator, registry) && r.attributes.role === "court" && typeof r.attributes.court === "string" && addressSchema.safeParse(r.attributes.wallet).success);
}
export const petitionCourts = (petition: ArkivRecord, courts: ArkivRecord[]) => courts.filter(c => c.attributes.court === petition.attributes.court);
const linked = (r: ArkivRecord, p: ArkivRecord) => isType(p, "petition") && r.attributes.app === "openpil" && String(r.attributes.petition).toLowerCase() === p.key.toLowerCase();
export const validReview = (r: ArkivRecord, p: ArkivRecord, courts: ArkivRecord[]) => linked(r, p) && isType(r, "review") && sameAddress(r.creator, p.creator) && sameAddress(r.owner, String(r.attributes.court)) && petitionCourts(p, courts).some(c => sameAddress(r.owner, String(c.attributes.wallet)));
const courtSigned = (r: ArkivRecord, p: ArkivRecord, courts: ArkivRecord[]) => linked(r, p) && petitionCourts(p, courts).some(c => sameAddress(r.creator, String(c.attributes.wallet)));
export const validExtension = (r: ArkivRecord, p: ArkivRecord, courts: ArkivRecord[]) => isType(r, "extension") && courtSigned(r, p, courts) && Number.isSafeInteger(Number(r.attributes.newdue));
export const validDecision = (r: ArkivRecord, p: ArkivRecord, courts: ArkivRecord[]) => isType(r, "decision") && courtSigned(r, p, courts) && ["accepted", "rejected"].includes(String(r.attributes.outcome));
const chronological = (a: ArkivRecord, b: ArkivRecord) => BigInt(a.createdAt) < BigInt(b.createdAt) ? -1 : BigInt(a.createdAt) > BigInt(b.createdAt) ? 1 : a.key.localeCompare(b.key);
export type PetitionStatus = "under-review" | "accepted" | "rejected" | "expired" | "review-incomplete";
export function derivePetition(petition: ArkivRecord, related: ArkivRecord[], courts: ArkivRecord[], timing: BlockTiming) {
  const now = timing.currentBlockTime * 1000;
  const live = related.filter(r => BigInt(r.expiresAt) > BigInt(timing.currentBlock) && BigInt(r.createdAt) <= BigInt(timing.currentBlock));
  const decision = live.filter(r => validDecision(r, petition, courts)).sort(chronological)[0];
  let due = Number(petition.attributes.duedate);
  const extensions: ArkivRecord[] = [];
  for (const r of live.filter(r => validExtension(r, petition, courts)).sort(chronological)) {
    if (decision && chronological(r, decision) >= 0) continue;
    const next = Number(r.attributes.newdue);
    if (blockToTime(r.createdAt, timing) <= due && next > due) { due = next; extensions.push(r); }
  }
  const review = live.find(r => validReview(r, petition, courts));
  const status: PetitionStatus = decision ? decision.attributes.outcome as "accepted" | "rejected" : now > due ? "expired" : review ? "under-review" : "review-incomplete";
  return { petition, review, decision, extensions, due, status, late: !!decision && blockToTime(decision.createdAt, timing) > due, filedAt: blockToTime(petition.createdAt, timing), decidedAt: decision ? blockToTime(decision.createdAt, timing) : undefined };
}
