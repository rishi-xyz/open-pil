import { expect, it } from "vitest";
import { cases, organisations, petitioners } from "./data";
import { markdownSchema, titleSchema } from "../../lib/arkiv/model";
it("provides one court, two petitioners and eight valid markdown petitions", () => {
  expect(organisations).toHaveLength(1); expect(organisations[0].role).toBe("court"); expect(petitioners).toHaveLength(2);
  for (const state of ["under-review", "accepted", "rejected", "expired"]) expect(cases.filter(c => c.state === state)).toHaveLength(2);
  expect(cases.filter(c => c.extension)).toHaveLength(1);
  for (const c of cases) { expect(markdownSchema.safeParse(c.body).success).toBe(true); expect(titleSchema.safeParse(c.title).success).toBe(true); expect(c.body).toContain("## Prayer for relief"); }
});

it("uses the eight mock bodies and matching court reasons within the byte limit", () => {
  expect(new Set(cases.map(c => c.body)).size).toBe(8);
  for (const c of cases) {
    expect(c.body).toContain("## Facts");
    expect(new TextEncoder().encode(c.body).length).toBeLessThanOrEqual(32768);
    if (c.state === "accepted" || c.state === "rejected") {
      expect(markdownSchema.safeParse(c.decisionReason).success).toBe(true);
    } else expect(c.decisionReason).toBeNull();
    if (c.extension) expect(markdownSchema.safeParse(c.extensionReason).success).toBe(true);
  }
  expect(cases.some(c => c.body.includes("## Grounds"))).toBe(true);
  expect(cases.some(c => c.body.includes("|---|"))).toBe(true);
  expect(cases.some(c => c.body.includes("> No person shall"))).toBe(true);
});

