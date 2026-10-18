import type { Entity } from "@arkiv-network/sdk";
import { z } from "zod";
import { APP, ENTITY_TYPES, payloadSchemas, revision3AttributeSchemas } from "./model";
export type ArkivRecord = { key: string; creator: string; owner: string; attributes: Record<string, string | number | boolean>; payload: Record<string, unknown> | string; createdAt: string; expiresAt: string };
export function serializeEntity(entity: Entity): ArkivRecord {
  if (!entity.key || !entity.creator || !entity.owner || entity.createdAt === undefined || entity.expiresAt === undefined || !entity.attributes) throw new Error("Incomplete entity projection");
  const attributes = Object.fromEntries(Object.entries(entity.attributes).map(([k, a]) => [k, typeof a.value === "bigint" ? a.value.toString() : a.value]));
  if (attributes.app !== APP) throw new Error("Entity is not an OpenPIL record");
  const parsedType = z.enum(ENTITY_TYPES).safeParse(attributes.type);
  if (!parsedType.success) throw new Error("Unknown OpenPIL entity type");
  if (parsedType.data in revision3AttributeSchemas) {
    const schema = revision3AttributeSchemas[parsedType.data as keyof typeof revision3AttributeSchemas];
    if (!schema.safeParse(attributes).success) throw new Error("Invalid OpenPIL attributes");
  }
  const payload = payloadSchemas[parsedType.data].safeParse(["petition", "extension", "decision"].includes(parsedType.data) ? (entity.contentType === "text/markdown" ? new TextDecoder("utf-8", { fatal: true }).decode(entity.payload) : undefined) : entity.toJson());
  if (!payload.success) throw new Error("Invalid OpenPIL payload");
  return { key: entity.key.toLowerCase(), creator: entity.creator.toLowerCase(), owner: entity.owner.toLowerCase(), attributes, payload: payload.data, createdAt: entity.createdAt.toString(), expiresAt: entity.expiresAt.toString() };
}

export function safeSerializeEntity(entity: Entity): ArkivRecord | undefined {
  try { return serializeEntity(entity); } catch { return undefined; }
}

export function serializePage(entities: readonly Entity[]) {
  const records = entities.flatMap(entity => {
    const record = safeSerializeEntity(entity);
    return record ? [record] : [];
  });
  return { records, malformedCount: entities.length - records.length };
}
