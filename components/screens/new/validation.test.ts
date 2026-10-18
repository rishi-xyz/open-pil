import { describe, expect, it } from "vitest";
import { byteLength, validatePetition } from "./validation";
const now = new Date("2026-10-18T00:00:00").getTime();
describe("petition input", () => {
  it("measures UTF-8 bytes rather than characters", () => {
    expect(byteLength("न")).toBe(3);
    expect(() => validatePetition("न".repeat(41), "Body", "2026-11-18", now)).toThrow();
  });
  it("accepts markdown at the byte limit and rejects oversized bodies", () => {
    expect(validatePetition(" Title ", "a".repeat(32768), "2026-11-18", now).title).toBe("Title");
    expect(() => validatePetition("Title", "a".repeat(32769), "2026-11-18", now)).toThrow();
  });
  it("rejects blank bodies and past or invalid dates", () => {
    expect(() => validatePetition("Title", "  ", "2026-11-18", now)).toThrow();
    for (const due of ["", "invalid", "2026-10-17"]) expect(() => validatePetition("Title", "Body", due, now)).toThrow();
  });
});

it("requires a review date after today, including late in the day", () => {
  for (const time of ["2026-10-18T00:00:00", "2026-10-18T23:59:58"]) {
    const current = new Date(time).getTime();
    expect(() => validatePetition("Title", "Body", "2026-10-18", current)).toThrow("Choose a date after today.");
    expect(validatePetition("Title", "Body", "2026-10-19", current).duedate).toBeGreaterThan(current);
  }
});
