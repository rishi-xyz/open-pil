import { ExpirationTime } from "@arkiv-network/sdk";
import type { Hex } from "viem";
import { publicClient, type ArkivWallet } from "../clients";
export async function keepAlive(wallet: ArkivWallet, entityKey: Hex) {
  const entity = await publicClient.getEntity(entityKey);
  if (entity.expiresAt === undefined) throw new Error("Missing expiry");
  if (entity.attributes?.app?.value !== "openpil") throw new Error("Not an OpenPIL entity");
  if (!["petition", "decision"].includes(String(entity.attributes?.type?.value))) throw new Error("Entity cannot be kept alive");
  const result = await wallet.extendEntity({ entityKey, expires: ExpirationTime.atBlock(entity.expiresAt + 30n * 43200n) });
  return { ...result, expiresAt: result.expiresAt.toString() };
}
