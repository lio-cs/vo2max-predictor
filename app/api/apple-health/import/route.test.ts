import { describe, it, expect } from "vitest";
import { parseImportBody } from "./route";

const VALID = { age: 30, restingHeartRate: 60, oxygenPercentage: 97 };

describe("parseImportBody", () => {
  it("parses a valid, complete payload", () => {
    expect(parseImportBody(VALID)).toEqual(VALID);
  });

  it("accepts a null oxygenPercentage (device doesn't support SpO2)", () => {
    expect(parseImportBody({ ...VALID, oxygenPercentage: null })).toEqual({ ...VALID, oxygenPercentage: null });
  });

  it("rejects null and non-objects", () => {
    expect(parseImportBody(null)).toBeNull();
    expect(parseImportBody("nope")).toBeNull();
  });

  it("rejects a missing field", () => {
    const incomplete: Record<string, unknown> = { ...VALID };
    delete incomplete.age;
    expect(parseImportBody(incomplete)).toBeNull();
  });

  it("rejects an out-of-range age", () => {
    expect(parseImportBody({ ...VALID, age: 0 })).toBeNull();
    expect(parseImportBody({ ...VALID, age: 121 })).toBeNull();
  });

  it("rejects an out-of-range resting heart rate", () => {
    expect(parseImportBody({ ...VALID, restingHeartRate: 19 })).toBeNull();
    expect(parseImportBody({ ...VALID, restingHeartRate: 221 })).toBeNull();
  });

  it("rejects an out-of-range oxygen percentage", () => {
    expect(parseImportBody({ ...VALID, oxygenPercentage: 49 })).toBeNull();
    expect(parseImportBody({ ...VALID, oxygenPercentage: 101 })).toBeNull();
  });

  it("rejects non-numeric fields", () => {
    expect(parseImportBody({ ...VALID, age: "30" })).toBeNull();
  });
});
