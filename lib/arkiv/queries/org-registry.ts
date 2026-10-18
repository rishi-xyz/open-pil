import { eq } from "@arkiv-network/sdk/query";
import type { Address } from "viem";
import { queryPage } from "./page";
export async function orgRegistry(registry: Address, cursor?: string) {
  const page = await queryPage([eq("type", "org")], cursor, { creator: registry });
  const records = page.records.flatMap(record => typeof record.payload === "string" ? [] : [{ ...record, payload: record.payload }]);
  return { ...page, records };
}
