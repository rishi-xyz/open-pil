import { expect, it } from "vitest";
import { Entity } from "@arkiv-network/sdk";
import { str, u64 } from "@arkiv-network/sdk/attr";
import { markdownSchema, titleSchema, petitionAttributes, reviewAttributes, extensionAttributes, decisionAttributes } from "./model";
import { serializeEntity, serializePage } from "./records";
const key = `0x${"ab".repeat(32)}` as const, address = `0x${"ab".repeat(20)}` as const;
it("enforces UTF-8 byte limits", () => {
  expect(markdownSchema.safeParse("a".repeat(32768)).success).toBe(true);
  expect(markdownSchema.safeParse("é".repeat(16385)).success).toBe(false);
  expect(titleSchema.safeParse("é".repeat(61)).success).toBe(false);
  expect(markdownSchema.safeParse("").success).toBe(false);
});
it("uses u64 for all revision 3 timestamps", () => {
  const p = petitionAttributes({ title: "Water", court: "VPHC", filedat: 1, duedate: 2 });
  for (const attr of [p.filedat, p.duedate, reviewAttributes(key, address, 2).duedate, extensionAttributes(key, 3).newdue, decisionAttributes(key, "accepted", 4).decidedat]) expect(attr.type).toBe("u64");
});
it("reads markdown as UTF-8 text rather than JSON and drops malformed content", () => {
  const entity = new Entity({ key, creator: address, owner: address, createdAt: 1n, expiresAt: 200n, attributes: { app: str("openpil"), type: str("petition"), title: str("Civic relief"), court: str("VPHC"), filedat: u64(100), duedate: u64(1000) }, contentType: "text/markdown", payload: new TextEncoder().encode("# Civic relief\n\nन्याय") });
  expect(serializeEntity(entity).payload).toBe("# Civic relief\n\nन्याय");
  entity.payload = new Uint8Array([255]);
  expect(serializePage([entity]).malformedCount).toBe(1);
  entity.payload = new TextEncoder().encode("{}"); entity.contentType = "application/json";
  expect(() => serializeEntity(entity)).toThrow();
});
