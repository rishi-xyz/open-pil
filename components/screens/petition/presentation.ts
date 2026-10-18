import type { ArkivRecord } from "@/lib/arkiv/records";
import { derivePetition } from "@/lib/arkiv/trust/revision3";
import type { CheckStep } from "@/components/motion/check-sequence";
export type PetitionState = ReturnType<typeof derivePetition>;
export const statusLabel = (status: PetitionState["status"]) => ({ "under-review": "Under review", accepted: "Accepted", rejected: "Rejected", expired: "Expired", "review-incomplete": "Review incomplete" })[status];
export function dateLabel(value?: number) {
  return value && Number.isFinite(value) && value > 0 ? new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC" : "Unknown";
}
export function decidedLabel(state: PetitionState) {
  if (state.decidedAt) return dateLabel(state.decidedAt);
  return state.status === "expired" ? "No decision, expired" : "Awaiting decision";
}
export function verificationChecks(state: PetitionState, courts: ArkivRecord[]): CheckStep[] {
  return [
    { label: "Petition entity found", state: "ok", detail: "Live entity read from Arkiv." },
    { label: "Court wallet is registered", state: courts.length ? "ok" : "fail", detail: courts.length ? "Registry creator and court code checked." : "No trusted court registration found." },
    { label: "Review lease", state: state.review && state.status === "under-review" ? "ok" : state.decision ? "skipped" : "warn", detail: state.review ? "Created by the petitioner, owned by the registered court." : "No live valid review lease found. Expired or deleted entities cannot be queried." },
    { label: "Court extensions", state: state.extensions.length ? "ok" : "skipped", detail: `${state.extensions.length} timely extensions accepted in chronological order.` },
    { label: "Court decision", state: state.decision ? state.late ? "warn" : "ok" : state.status === "expired" ? "fail" : "waiting", detail: state.decision ? `Signed by a registered court wallet${state.late ? ", after the effective due date" : ", on time"}.` : "No valid decision recorded." },
  ];
}
export function reasonValid(value: string) { const size = new TextEncoder().encode(value).length; return !!value.trim() && size <= 32768; }
export function extensionValid(value: string, due: number) { const next = Date.parse(value); return Number.isFinite(next) && next > due; }
