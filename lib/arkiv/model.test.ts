import { expect, it } from "vitest";
import { Entity } from "@arkiv-network/sdk";
import { str, u64, i32 } from "@arkiv-network/sdk/attr";
import { petitionAttributes } from "./model";
import { serializeEntity, serializePage } from "./records";
const key = `0x${"ab".repeat(32)}` as const, address = `0x${"ab".repeat(20)}` as const;
it("attribute builders discard runtime fields outside the model", () => {
  const attributes = petitionAttributes({ title: "Water", court: "VPHC", filedat: 1, duedate: 2, app: "spoof", type: "decision", injected: "bad" } as Parameters<typeof petitionAttributes>[0]);
  expect(attributes.app).toBe("openpil");
  expect(attributes.type).toBe("petition");
  expect(attributes).not.toHaveProperty("injected");
});
it("serializes blocks and timestamps and counts malformed and removed types", () => {
  const fields = { key, creator: address, owner: address, createdAt: 1n, expiresAt: 100n, attributes: { app: str("openpil"), type: str("review"), petition: str(key), court: str(address), duedate: u64(1792400000000n), extensions: i32(0) }, payload: new TextEncoder().encode("{}") };
  const result = serializeEntity(new Entity(fields));
  expect(result.attributes.duedate).toBe("1792400000000");
  expect(result.createdAt).toBe("1");
  expect(() => JSON.stringify(result)).not.toThrow();
  const page = serializePage([new Entity(fields), ...["unknown", "pil", "pending", "response", "adjournment"].map(type => new Entity({ ...fields, attributes: { ...fields.attributes, type: str(type) } })), new Entity({ ...fields, payload: new TextEncoder().encode("not JSON") }), new Entity({ ...fields, payload: new TextEncoder().encode('{"bad":true}') })]);
  expect(page.records).toEqual([result]);
  expect(page.malformedCount).toBe(7);
});
