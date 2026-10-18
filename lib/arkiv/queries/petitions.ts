import { eq, or } from "@arkiv-network/sdk/query";
import type { Hex } from "viem";
import { queryPage } from "./page";
import { publicClient, type ArkivReader } from "../clients";
import { serializeEntity } from "../records";
import { hashSchema } from "../model";
export const petitions = (cursor?: string, creator?: Hex) => queryPage([eq("type", "petition")], cursor, { creator });
export const courts = (registry: Hex, cursor?: string, reader?: ArkivReader) => queryPage([eq("type", "org"), eq("role", "court")], cursor, { creator: registry }, reader);
export const reviewsOwnedBy = (owner: Hex, cursor?: string) => queryPage([eq("type", "review")], cursor, { owner });
export const petitionRelated = (key: string, cursor?: string, reader?: ArkivReader) => queryPage([eq("petition", hashSchema.parse(key))], cursor, undefined, reader);
export const petitionActivity = (cursor?: string) => queryPage([or(eq("type", "review"), eq("type", "extension"), eq("type", "decision"))], cursor);
export async function petitionBundle(key: Hex, cursor?: string, reader: ArkivReader = publicClient) {
  const [entity, related] = await Promise.all([reader.getEntity(key), petitionRelated(key, cursor, reader)]);
  const petition = serializeEntity(entity);
  if (petition.attributes.type !== "petition") throw new Error("Expected a petition");
  return { petition, ...related };
}
