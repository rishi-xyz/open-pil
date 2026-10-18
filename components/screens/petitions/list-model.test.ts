import { expect, it } from "vitest";
import { filterPetitions, reviewFraction, type PetitionRow } from "./list-model";
const row = (status: PetitionRow["status"], title: string): PetitionRow => ({ petition: { key: "0x1", creator: "0x2", owner: "0x2", attributes: { title, court: "VPHC" }, payload: "Body", createdAt: "1", expiresAt: "100" }, review: undefined, decision: undefined, extensions: [], due: 200, filedAt: 100, status, late: false, decidedAt: undefined });
it("combines title, court and status filters without conflating incomplete reviews", () => {
  const rows = [row("under-review", "Water Supply"), row("expired", "Water drains"), row("review-incomplete", "Road")];
  expect(filterPetitions(rows, "under-review", "VPHC", " WATER ")).toEqual([rows[0]]);
  expect(filterPetitions(rows, "all", "OTHER", "")).toEqual([]);
  expect(filterPetitions(rows, "all", "", "")).toHaveLength(3);
});
it("drains review time and clamps expired and late decision bars", () => {
  expect(reviewFraction(row("under-review", "Title"), 150)).toBe(.5);
  expect(reviewFraction(row("expired", "Title"), 250)).toBe(1);
  const accepted = row("accepted", "Title");
  accepted.decision = accepted.petition; accepted.decidedAt = 300;
  expect(reviewFraction(accepted, 400)).toBe(1);
});

it("fills decided bars even when the court decides early", () => {
  for (const status of ["accepted", "rejected"] as const) {
    const decided = row(status, "Title");
    decided.decision = decided.petition;
    decided.decidedAt = 125;
    expect(reviewFraction(decided, 150)).toBe(1);
    expect(reviewFraction(decided, 1000)).toBe(1);
  }
});
