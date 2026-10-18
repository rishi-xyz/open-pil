import { describe, expect, it } from "vitest";
import type { ArkivRecord } from "../records";
import { derivePetition, registeredCourts, validDecision, validExtension, validReview } from "./revision3";
import { snapshotPetitions, petitionBuckets } from "../snapshot";
const filer = `0x${"a".repeat(40)}`, court = `0x${"b".repeat(40)}`, registry = `0x${"c".repeat(40)}`;
const timing = { currentBlock: "100", currentBlockTime: 1000, blockDuration: 2 };
function record(type: string, attrs = {}, fields: Partial<ArkivRecord> = {}): ArkivRecord { return { key: `0x${type.padEnd(64, "0")}`, creator: court, owner: court, createdAt: "50", expiresAt: "200", payload: {}, attributes: { app: "openpil", type, ...attrs }, ...fields }; }
const org = record("org", { wallet: court, court: "VPHC", role: "court" }, { creator: registry });
const courts = registeredCourts([org], registry);
const petition = record("petition", { court: "VPHC", title: "Public water", duedate: 1100000 }, { creator: filer, owner: filer });
const review = record("review", { petition: petition.key, court, duedate: 1100000, extensions: 0 }, { creator: filer });
const decision = (outcome = "accepted", fields = {}) => record("decision", { petition: petition.key, outcome, decidedat: 1, late: "no" }, fields);
const extension = (due: number, fields = {}) => record("extension", { petition: petition.key, newdue: due }, fields);
describe("revision 3 trust", () => {
  it("requires registry creator, court role, and court code", () => {
    expect(courts).toHaveLength(1);
    expect(registeredCourts([{ ...org, creator: filer }, { ...org, attributes: { ...org.attributes, role: "respondent" } }], registry)).toEqual([]);
    expect(validDecision(decision(), { ...petition, attributes: { ...petition.attributes, court: "OTHER" } }, courts)).toBe(false);
  });
  it("checks review creator, owner, link and designated court", () => {
    expect(validReview(review, petition, courts)).toBe(true);
    for (const bad of [{ ...review, creator: court }, { ...review, owner: filer }, { ...review, attributes: { ...review.attributes, petition: "other" } }, { ...review, attributes: { ...review.attributes, court: filer } }]) expect(validReview(bad, petition, courts)).toBe(false);
  });
  it("rejects spoofed decisions, outcomes and extensions", () => {
    expect(validDecision(decision(), petition, courts)).toBe(true);
    expect(validDecision(decision("other"), petition, courts)).toBe(false);
    expect(validDecision(decision("accepted", { creator: filer }), petition, courts)).toBe(false);
    expect(validExtension(extension(1200000, { creator: filer }), petition, courts)).toBe(false);
    expect(validDecision(decision(), petition, [])).toBe(false);
  });
});
describe("revision 3 status", () => {
  it("requires a live valid review for under review", () => {
    expect(derivePetition(petition, [review], courts, timing).status).toBe("under-review");
    expect(derivePetition(petition, [], courts, timing).status).toBe("review-incomplete");
    expect(derivePetition(petition, [{ ...review, expiresAt: "100" }], courts, timing).status).toBe("review-incomplete");
  });
  it("expires by effective due date even if the review survives", () => {
    expect(derivePetition(petition, [review], courts, { ...timing, currentBlockTime: 1200 }).status).toBe("expired");
  });
  it.each(["accepted", "rejected"])("derives %s and lateness from creation block", outcome => {
    const result = derivePetition(petition, [decision(outcome, { createdAt: "90" })], courts, { ...timing, currentBlockTime: 1200 });
    expect(result.status).toBe(outcome); expect(result.late).toBe(true);
    expect(derivePetition(petition, [decision(outcome)], courts, timing).late).toBe(false);
  });
  it("accepts chronological timely increasing extensions and ignores retroactive ones", () => {
    const result = derivePetition(petition, [extension(1500000, { createdAt: "90" }), extension(1300000, { createdAt: "40" }), extension(1050000, { createdAt: "55" })], courts, { ...timing, currentBlockTime: 1200 });
    expect(result.due).toBe(1500000); expect(result.extensions).toHaveLength(2);
    expect(derivePetition(petition, [extension(1500000, { createdAt: "90" })], courts, { ...timing, currentBlockTime: 1200 }).due).toBe(1100000);
  });
  it("ignores expired, future and post-decision extensions, chooses first decision deterministically", () => {
    const result = derivePetition(petition, [decision("rejected", { createdAt: "70" }), decision(), extension(1500000, { createdAt: "60" }), extension(1600000, { createdAt: "101" }), extension(1700000, { expiresAt: "100" })], courts, timing);
    expect(result.status).toBe("accepted"); expect(result.due).toBe(1100000);
  });
  it("bundles snapshots and buckets without including expired petitions", () => {
    const rows = snapshotPetitions([org, petition, review, { ...petition, key: "expired", expiresAt: "100" }], registry, timing);
    expect(rows).toHaveLength(1); expect(petitionBuckets(rows).underReview).toHaveLength(1);
    expect(() => JSON.stringify(rows)).not.toThrow();
  });
});
