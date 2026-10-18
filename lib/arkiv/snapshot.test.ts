import { describe, expect, it } from "vitest";
import type { ArkivRecord } from "./records";
import { snapshotOrgs, snapshotPetition, snapshotPetitions, petitionBuckets } from "./snapshot";
const filer = `0x${"a".repeat(40)}`, court = `0x${"b".repeat(40)}`, registry = `0x${"c".repeat(40)}`;
const timing = { currentBlock: "100", currentBlockTime: 1000, blockDuration: 2 };
function record(key: string, type: string, attributes = {}, fields: Partial<ArkivRecord> = {}): ArkivRecord {
  return { key, creator: filer, owner: filer, createdAt: "50", expiresAt: "200", payload: {}, attributes: { app: "openpil", type, ...attributes }, ...fields };
}
const org = record("org", "org", { role: "court", court: "VPHC", wallet: court }, { creator: registry });
const petition = record("petition", "petition", { title: "Water", court: "VPHC", duedate: 1100000 });
const review = record("review", "review", { petition: petition.key, court }, { owner: court });
const decision = record("decision", "decision", { petition: petition.key, outcome: "accepted" }, { creator: court });
describe("revision 3 snapshot derivation", () => {
  it("trusts registry creator rather than owner or claimed court wallet", () => {
    const forged = { ...org, creator: filer, owner: registry };
    expect(snapshotOrgs([forged, org], registry.toUpperCase())).toEqual([org]);
    expect(snapshotPetitions([forged, petition, review], registry, timing)[0].status).toBe("review-incomplete");
    expect(snapshotPetitions([org, petition, review], registry, timing)[0].status).toBe("under-review");
  });
  it("requires a live petitioner-created review owned by the registered court", () => {
    for (const bad of [{ ...review, creator: court }, { ...review, owner: filer }, { ...review, expiresAt: "100" }, { ...review, attributes: { ...review.attributes, petition: "other" } }]) {
      expect(snapshotPetitions([org, petition, bad], registry, timing)[0].status).toBe("review-incomplete");
    }
  });
  it("ignores forged decisions and resolves a case insensitive bundle", () => {
    const forged = { ...decision, creator: filer, owner: court };
    const records = [org, petition, review, forged];
    expect(snapshotPetition(records, "PETITION", registry, timing)?.status).toBe("under-review");
    const row = snapshotPetition([...records, decision], petition.key, registry, timing)!;
    expect(row.status).toBe("accepted");
    expect(row.decision).toEqual(decision);
    expect(row.late).toBe(false);
    expect(snapshotPetition(records, "absent", registry, timing)).toBeUndefined();
    expect(() => JSON.stringify(row)).not.toThrow();
  });
  it("buckets every status and excludes expired entities", () => {
    const records: ArkivRecord[] = [org];
    for (const [i, status] of ["under-review", "accepted", "rejected", "expired", "review-incomplete"].entries()) {
      const key = `petition-${i}`;
      records.push({ ...petition, key, attributes: { ...petition.attributes, duedate: status === "expired" ? 900000 : 1100000 } });
      if (status === "under-review" || status === "expired") records.push({ ...review, key: `review-${i}`, attributes: { ...review.attributes, petition: key } });
      if (status === "accepted" || status === "rejected") records.push({ ...decision, key: `decision-${i}`, attributes: { ...decision.attributes, petition: key, outcome: status } });
    }
    records.push({ ...petition, key: "gone", expiresAt: "100" });
    const buckets = petitionBuckets(snapshotPetitions(records, registry, timing));
    expect(buckets.all).toHaveLength(5);
    for (const bucket of [buckets.underReview, buckets.accepted, buckets.rejected, buckets.expired, buckets.incomplete]) expect(bucket).toHaveLength(1);
    expect(buckets.expired[0].review).toBeDefined();
  });
});
