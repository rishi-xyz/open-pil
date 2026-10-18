import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk";
import type { Address } from "viem";
import { publicClient, type ArkivWallet } from "../clients";
import { petitionAttributes, reviewAttributes, type PetitionAttributes } from "../model";
import { registeredCourts } from "../trust/revision3";
import type { ArkivRecord } from "../records";
import { markdownEntity } from "./markdown";
export async function filePetition(wallet: ArkivWallet, attributes: PetitionAttributes, body: string, court: Address, orgs: ArkivRecord[], registry: string) {
  const entity = markdownEntity(petitionAttributes(attributes), body);
  if (attributes.duedate <= Date.now()) throw new Error("Due date must be in the future");
  if (!registeredCourts(orgs, registry).some(r => r.attributes.court === attributes.court && String(r.attributes.wallet).toLowerCase() === court.toLowerCase())) throw new Error("Court is not registered for this code");
  const [petition, review] = await publicClient.predictEntityKeys({ owner: wallet.account.address, count: 2 });
  const result = await wallet.executeBatch({ creates: [{ ...entity, salt: petition.salt }, { attributes: reviewAttributes(petition.key, court, attributes.duedate), payload: jsonToPayload({}), contentType: "application/json", expires: ExpirationTime.atDate(new Date(attributes.duedate)), salt: review.salt }], ownershipChanges: [{ entityKey: review.key, newOwner: court }] });
  return { petitionKey: result.createdEntities[0], reviewKey: result.createdEntities[1], txHash: result.txHash, predictionMismatch: result.createdEntities[0] !== petition.key || result.createdEntities[1] !== review.key };
}
