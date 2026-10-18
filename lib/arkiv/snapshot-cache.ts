import { z } from "zod";
import { addressSchema, APP, ENTITY_TYPES, hashSchema, payloadSchemas, revision3AttributeSchemas } from "./model";
import type { OpenpilSnapshot } from "./snapshot";

export const snapshotStorageKey = "openpil:snapshot:v1";
const block = z.string().regex(/^\d+$/);
const recordSchema = z.object({
  key: hashSchema,
  creator: addressSchema,
  owner: addressSchema,
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  payload: z.union([z.string(), z.record(z.string(), z.unknown())]),
  createdAt: block,
  expiresAt: block,
}).superRefine((record, context) => {
  const type = z.enum(ENTITY_TYPES).safeParse(record.attributes.type);
  const attributes = type.success && type.data in revision3AttributeSchemas ? revision3AttributeSchemas[type.data as keyof typeof revision3AttributeSchemas].safeParse(record.attributes).success : true;
  if (!attributes || record.attributes.app !== APP || !type.success || !payloadSchemas[type.data].safeParse(record.payload).success) {
    context.addIssue({ code: "custom", message: "Invalid OpenPIL record" });
  }
});
const cacheSchema = z.object({
  savedAt: z.number().int().positive().safe(),
  snapshot: z.object({
    records: z.array(recordSchema),
    timing: z.object({ currentBlock: block, currentBlockTime: z.number().nonnegative(), blockDuration: z.number().positive() }),
  }),
});

export function readSnapshotCache() {
  try {
    const raw = window.sessionStorage.getItem(snapshotStorageKey);
    if (!raw) return undefined;
    const result = cacheSchema.safeParse(JSON.parse(raw));
    return result.success && result.data.savedAt <= Date.now() ? result.data : undefined;
  } catch {
    return undefined;
  }
}

export function saveSnapshotCache(snapshot: OpenpilSnapshot, savedAt = Date.now()) {
  try {
    window.sessionStorage.setItem(snapshotStorageKey, JSON.stringify({ snapshot, savedAt }));
  } catch {
    // Storage can be unavailable or full; the in-memory query remains usable.
  }
}
