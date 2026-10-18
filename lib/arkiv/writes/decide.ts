import type { Address, Hex } from "viem";
import { publicClient, type ArkivReader, type ArkivWallet } from "../clients";
import { decisionAttributes, outcomeSchema } from "../model";
import { markdownEntity } from "./markdown";
import { reviewContext, type ReviewContext } from "./review-context";
// One batch records the decision and, when the signer still owns the live lease, closes it.
export function decisionBatch(context: Pick<ReviewContext, "review">, signer: Address, petitionKey: Hex, outcome: "accepted" | "rejected", reason: string, now = Date.now()) {
  const entity = markdownEntity(decisionAttributes(petitionKey, outcomeSchema.parse(outcome), now), reason);
  const owned = context.review && context.review.owner === signer.toLowerCase();
  return { creates: [entity], deletes: owned ? [{ entityKey: context.review!.key as Hex }] : undefined };
}
export async function decide(wallet: ArkivWallet, petitionKey: Hex, outcome: "accepted" | "rejected", reason: string, registry: Hex, reader: ArkivReader = publicClient) {
  const context = await reviewContext(wallet, petitionKey, registry, reader);
  return wallet.executeBatch(decisionBatch(context, wallet.account.address, petitionKey, outcome, reason));
}
