import { describe, it, expect } from "vitest";
import { validateGeminiCopy } from "./geminiCoach";

const VALID = {
  riskExplanation: "Your STOP-BANG score puts you in the low-risk group for sleep apnea.",
  actionRationale: "Low risk means keeping an eye on things is enough for now.",
  motivationalNudge: "Your VO2max has been trending up over the last week — nice work.",
};

describe("validateGeminiCopy", () => {
  it("accepts a well-formed response and trims whitespace", () => {
    const result = validateGeminiCopy({
      riskExplanation: `  ${VALID.riskExplanation}  `,
      actionRationale: VALID.actionRationale,
      motivationalNudge: VALID.motivationalNudge,
    });
    expect(result.riskExplanation).toBe(VALID.riskExplanation);
  });

  it("rejects a non-object value", () => {
    expect(() => validateGeminiCopy("not an object")).toThrow(/not a JSON object/);
    expect(() => validateGeminiCopy(null)).toThrow(/not a JSON object/);
  });

  it("rejects a missing required field", () => {
    const rest: Record<string, unknown> = { ...VALID };
    delete rest.riskExplanation;
    expect(() => validateGeminiCopy(rest)).toThrow(/missing or empty required field: riskExplanation/);
  });

  it("rejects an empty-string field", () => {
    expect(() => validateGeminiCopy({ ...VALID, motivationalNudge: "   " })).toThrow(
      /missing or empty required field: motivationalNudge/
    );
  });

  it("rejects a field that exceeds the length bound", () => {
    expect(() => validateGeminiCopy({ ...VALID, actionRationale: "x".repeat(601) })).toThrow(
      /exceeded expected length/
    );
  });

  it("accepts a field right at the length bound", () => {
    expect(() =>
      validateGeminiCopy({ ...VALID, actionRationale: "x".repeat(600) })
    ).not.toThrow();
  });

  describe("diagnostic-language guard", () => {
    const cases = [
      "You have obstructive sleep apnea, so please see a doctor.",
      "You've got OSA based on this screening.",
      "You're diagnosed with a sleep disorder.",
      "This confirms you have a breathing issue at night.",
      "You definitely have sleep apnea.",
      "This is a diagnosis you should act on.",
    ];

    for (const text of cases) {
      it(`rejects: "${text}"`, () => {
        expect(() => validateGeminiCopy({ ...VALID, riskExplanation: text })).toThrow(
          /diagnostic-sounding language/
        );
      });
    }

    it("does not false-positive on legitimate risk-tier language", () => {
      expect(() =>
        validateGeminiCopy({
          ...VALID,
          riskExplanation: "You're in the high-risk group, which means it's worth mentioning to a doctor.",
        })
      ).not.toThrow();
    });
  });
});
