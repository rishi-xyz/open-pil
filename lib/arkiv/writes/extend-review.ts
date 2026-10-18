import { ExpirationTime } from "@arkiv-network/sdk";
import { u64 } from "@arkiv-network/sdk/attr";
import type { Address, Hex } from "viem";
import { publicClient, type ArkivReader, type ArkivWallet } from "../clients";
import { extensionAttributes } from "../model";
import { markdownEntity } from "./markdown";
import { reviewContext, type ReviewContext } from "./review-context";
export const EXTENSION_REQUIRES_LIVE_REVIEW = "A live review and a later deadline are required";
// One batch records the reason, patches the lease deadline and count, and extends the lease expiry.
export function extensionBatch(context: Pick<ReviewContext, "review" | "clock" | "due">, signer: Address, petitionKey: Hex, due: number, reason: string) {
  const entity = markdownEntity(extensionAttributes(petitionKey, due), reason);
  const { review, clock, due: oldDue } = context;
  if (!review || review.owner !== signer.toLowerCase() || clock.currentBlockTime * 1000 > oldDue || due <= oldDue) throw new Error(EXTENSION_REQUIRES_LIVE_REVIEW);
  const count = Number(review.attributes.extensions);
  if (!Number.isInteger(count) || count < 0) throw new Error("Invalid extension count");
  const computed = clock.currentBlock + BigInt(Math.ceil((due / 1000 - clock.currentBlockTime) / clock.blockDuration));
  const next = BigInt(review.expiresAt) + 1n;
  return { creates: [entity], patches: [{ entityKey: review.key as Hex, set: { duedate: u64(due), extensions: count + 1 } }], extensions: [{ entityKey: review.key as Hex, expires: ExpirationTime.atBlock(next > computed ? next : computed) }] };
}
export async function extendReview(wallet: ArkivWallet, petitionKey: Hex, due: number, reason: string, registry: Hex, reader: ArkivReader = publicClient) {
  const context = await reviewContext(wallet, petitionKey, registry, reader);
  return wallet.executeBatch(extensionBatch(context, wallet.account.address, petitionKey, due, reason));
}
