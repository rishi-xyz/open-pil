import type { ArkivRecord } from "../records";
import { sameAddress } from "../trust/rules";
import type { ReviewContext } from "../writes/review-context";
import type { CourtAction, CourtRequest } from "./schema";
// derivePetition types decision as present; at runtime it is the first valid decision or undefined.
export type GuardContext = Pick<ReviewContext, "status" | "due" | "clock"> & { review: ArkivRecord | undefined; decision?: ArkivRecord };
// Every public court write re-reads chain state and must pass all of these before signing.
export function courtGuard(context: GuardContext, court: string, action: CourtAction, request: CourtRequest): string | null {
  if (context.decision) return "A decision is already recorded";
  if (!context.review) return "No live review lease was found";
  if (!sameAddress(context.review.owner, court)) return "The review lease is not owned by the demo court";
  if (context.clock.currentBlockTime * 1000 > context.due || context.status !== "under-review") return "The review deadline has passed";
  if (action === "extend") {
    const due = (request as CourtRequest<"extend">).due;
    if (!(due > context.due)) return "The new deadline must be after the current deadline";
  }
  return null;
}
