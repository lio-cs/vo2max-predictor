import { describe, it, expect } from "vitest";
import { parseStopBangAnswers } from "./route";

const VALID = {
  snoring: true,
  tiredness: false,
  observedApnea: false,
  highBloodPressure: true,
  bmiOver35: false,
  ageOver50: true,
  neckOver40cm: false,
  male: true,
};

describe("parseStopBangAnswers", () => {
  it("parses a valid, complete payload", () => {
    expect(parseStopBangAnswers(VALID)).toEqual(VALID);
  });

  it("rejects null", () => {
    expect(parseStopBangAnswers(null)).toBeNull();
  });

  it("rejects a non-object (string, number, array)", () => {
    expect(parseStopBangAnswers("nope")).toBeNull();
    expect(parseStopBangAnswers(42)).toBeNull();
  });

  it("rejects a payload missing a required field", () => {
    const incomplete: Record<string, unknown> = { ...VALID };
    delete incomplete.male;
    expect(parseStopBangAnswers(incomplete)).toBeNull();
  });

  it("rejects a payload where a field is the wrong type", () => {
    expect(parseStopBangAnswers({ ...VALID, snoring: "true" })).toBeNull();
    expect(parseStopBangAnswers({ ...VALID, ageOver50: 1 })).toBeNull();
  });

  it("ignores unrelated extra keys rather than rejecting them", () => {
    expect(parseStopBangAnswers({ ...VALID, extraneousField: "whatever" })).toEqual(VALID);
  });

  it("rejects an empty object", () => {
    expect(parseStopBangAnswers({})).toBeNull();
  });
});
