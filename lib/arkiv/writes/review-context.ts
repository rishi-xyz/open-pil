import type { Hex } from "viem";
import { publicClient, type ArkivReader, type ArkivWallet } from "../clients";
import { petitionBundle, petitionRelated, courts } from "../queries/petitions";
import { derivePetition, petitionCourts, registeredCourts } from "../trust/revision3";
export const NOT_REGISTERED_COURT = "Only the registered court may act";
export const DECISION_EXISTS = "A decision is already recorded";
export type ReviewContext = Awaited<ReturnType<typeof reviewContext>>;
export async function reviewContext(wallet: Pick<ArkivWallet, "account">, key: Hex, registry: Hex, reader: ArkivReader = publicClient) {
  const [bundle, first, clock] = await Promise.all([petitionBundle(key, undefined, reader), courts(registry, undefined, reader), reader.getBlockTiming()]);
  const orgs = [...first.records];
  let cursor = first.cursor;
  while (cursor) { const page = await courts(registry, cursor, reader); orgs.push(...page.records); cursor = page.cursor; }
  const related = [...bundle.records];
  cursor = bundle.cursor;
  while (cursor) { const page = await petitionRelated(key, cursor, reader); related.push(...page.records); cursor = page.cursor; }
  const registered = registeredCourts(orgs, registry);
  if (!petitionCourts(bundle.petition, registered).some(c => String(c.attributes.wallet).toLowerCase() === wallet.account.address.toLowerCase())) throw new Error(NOT_REGISTERED_COURT);
  const timing = { ...clock, currentBlock: clock.currentBlock.toString() };
  const derived = derivePetition(bundle.petition, related, registered, timing);
  if (derived.decision) throw new Error(DECISION_EXISTS);
  return { ...derived, clock };
}
