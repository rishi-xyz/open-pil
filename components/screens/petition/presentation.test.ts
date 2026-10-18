import { describe, expect, it } from "vitest";
import type { ArkivRecord } from "@/lib/arkiv/records";
import { derivePetition } from "@/lib/arkiv/trust/revision3";
import { dateLabel, decidedLabel, extensionValid, reasonValid, statusLabel, verificationChecks } from "./presentation";
const petitioner = "0x" + "1".repeat(40), judge = "0x" + "2".repeat(40);
const record = (type: string, attributes = {}, creator = judge): ArkivRecord => ({ key: type, creator, owner: judge, createdAt: "10", expiresAt: "100", payload: "Reason", attributes: { app: "openpil", type, petition: "petition", ...attributes } });
const petition = record("petition", { duedate: 200000, court: "VPHC" }, petitioner);
const court = record("org", { court: "VPHC", wallet: judge, role: "court" });
const timing = { currentBlock: "20", currentBlockTime: 100, blockDuration: 2 };
describe("petition detail presentation", () => {
  it("measures markdown as UTF-8 bytes and rejects empty or oversized reasons", () => {
    expect(reasonValid("  ")).toBe(false);
    expect(reasonValid("é".repeat(16384))).toBe(true);
    expect(reasonValid("é".repeat(16385))).toBe(false);
  });
  it("requires a strictly later, parseable extension", () => {
    const due = Date.parse("2026-10-20T12:00Z");
    expect(extensionValid("2026-10-20T12:00Z", due)).toBe(false);
    expect(extensionValid("2026-10-21T12:00Z", due)).toBe(true);
    expect(extensionValid("", due)).toBe(false);
  });
  it("does not call a missing lease verified or infer its deletion", () => {
    const checks = verificationChecks(derivePetition(petition, [], [court], timing), [court]);
    expect(checks.find(c => c.label === "Review lease")?.state).toBe("warn");
    expect(checks.find(c => c.label === "Court decision")?.state).toBe("waiting");
  });
  it("ignores forged decisions in the status and checks", () => {
    const forged = record("decision", { outcome: "accepted" }, petitioner);
    const state = derivePetition(petition, [forged], [court], timing);
    expect(state.decision).toBeUndefined();
    expect(statusLabel(state.status)).toBe("Review incomplete");
    expect(verificationChecks(state, [])[1].state).toBe("fail");
  });
  it("marks a chain-late decision as a warning", () => {
    const state = derivePetition({ ...petition, attributes: { ...petition.attributes, duedate: 50000 } }, [record("decision", { outcome: "rejected" })], [court], timing);
    expect(state.late).toBe(true);
    expect(statusLabel(state.status)).toBe("Rejected");
    expect(verificationChecks(state, [court]).at(-1)?.state).toBe("warn");
  });
  it("labels the decided date for readers", () => {
    expect(decidedLabel(derivePetition(petition, [], [court], timing))).toBe("Awaiting decision");
    const decided = derivePetition(petition, [record("decision", { outcome: "accepted" })], [court], timing);
    expect(decidedLabel(decided)).toBe(dateLabel(decided.decidedAt));
    expect(decidedLabel({ ...decided, status: "expired", decidedAt: undefined } as typeof decided)).toBe("No decision, expired");
  });
  it("hides unknown dates and formats dates in a fixed timezone", () => {
    expect(dateLabel(0)).toBe("Unknown");
    expect(dateLabel(NaN)).toBe("Unknown");
    expect(dateLabel(1792324800000)).toContain("UTC");
  });
});
