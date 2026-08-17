import { describe, it, expect } from "vitest";
import { vo2MaxFromAppleSession } from "./vo2max-service";
import { estimateVO2Max } from "./vo2max";
import type { AppleHealthSession } from "./appleHealthSession";

function makeSession(overrides: Partial<AppleHealthSession> = {}): AppleHealthSession {
  return { id: "import-abc", age: 30, restingHeartRate: 60, oxygenPercentage: 97, importedAt: Date.now(), ...overrides };
}

describe("vo2MaxFromAppleSession", () => {
  it("computes vo2max via the same estimateVO2Max formula used by the Google pipeline", () => {
    const session = makeSession({ age: 30, restingHeartRate: 60 });
    const result = vo2MaxFromAppleSession(session);
    const expected = Math.round(estimateVO2Max(30, 60) * 10) / 10;
    expect(result).toEqual({ age: 30, restingHeartRate: 60, vo2max: expected });
  });

  it("passes age and restingHeartRate through unchanged", () => {
    const result = vo2MaxFromAppleSession(makeSession({ age: 45, restingHeartRate: 72 }));
    expect(result.age).toBe(45);
    expect(result.restingHeartRate).toBe(72);
  });
});
