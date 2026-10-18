import { eq, type Expression } from "@arkiv-network/sdk/query";
import type { Hex } from "viem";
import { publicClient, type ArkivReader } from "../clients";
import { APP } from "../model";
import { serializePage } from "../records";
export async function queryPage(filters: Expression[], cursor?: string, identity?: { creator?: Hex; owner?: Hex }, reader: ArkivReader = publicClient) {
  let query = reader.select("*").where(eq("app", APP), ...filters).limit(50);
  if (identity?.creator) query = query.createdBy(identity.creator);
  if (identity?.owner) query = query.ownedBy(identity.owner);
  if (cursor) query = query.cursor(cursor);
  const page = await query.fetch();
  const serialized = serializePage(page.entities);
  serialized.records.sort((a, b) => BigInt(a.createdAt) > BigInt(b.createdAt) ? -1 : BigInt(a.createdAt) < BigInt(b.createdAt) ? 1 : a.key.localeCompare(b.key));
  return { ...serialized, cursor: page.cursor, blockNumber: page.blockNumber.toString() };
}
