import { describe, it, expect } from "vitest";
import { validateFollowUpAnswer } from "./geminiCoach";

const VALID_SUGGESTIONS = ["What does that mean for me?", "Should I mention this to my doctor?"];

describe("validateFollowUpAnswer", () => {
  it("accepts a well-formed response, trims whitespace, and returns the suggestions", () => {
    const result = validateFollowUpAnswer({
      answer: "  STOP-BANG is an 8-item screening tool.  ",
      suggestedFollowUps: VALID_SUGGESTIONS,
    });
    expect(result.answer).toBe("STOP-BANG is an 8-item screening tool.");
    expect(result.suggestedFollowUps).toEqual(VALID_SUGGESTIONS);
  });

  it("rejects a non-object value", () => {
    expect(() => validateFollowUpAnswer("nope")).toThrow(/not a JSON object/);
    expect(() => validateFollowUpAnswer(null)).toThrow(/not a JSON object/);
  });

  it("rejects a missing answer field", () => {
    expect(() => validateFollowUpAnswer({ suggestedFollowUps: VALID_SUGGESTIONS })).toThrow(
      /missing or empty required field: answer/
    );
  });

  it("rejects an empty-string answer", () => {
    expect(() => validateFollowUpAnswer({ answer: "   ", suggestedFollowUps: VALID_SUGGESTIONS })).toThrow(
      /missing or empty required field: answer/
    );
  });

  it("rejects an answer that exceeds the length bound", () => {
    expect(() =>
      validateFollowUpAnswer({ answer: "x".repeat(601), suggestedFollowUps: VALID_SUGGESTIONS })
    ).toThrow(/exceeded expected length/);
  });

  describe("suggestedFollowUps validation", () => {
    it("rejects a missing suggestedFollowUps field", () => {
      expect(() => validateFollowUpAnswer({ answer: "An answer." })).toThrow(
        /missing or empty required field: suggestedFollowUps/
      );
    });

    it("rejects an empty suggestedFollowUps array", () => {
      expect(() => validateFollowUpAnswer({ answer: "An answer.", suggestedFollowUps: [] })).toThrow(
        /missing or empty required field: suggestedFollowUps/
      );
    });

    it("rejects a non-array suggestedFollowUps", () => {
      expect(() =>
        validateFollowUpAnswer({ answer: "An answer.", suggestedFollowUps: "not an array" })
      ).toThrow(/missing or empty required field: suggestedFollowUps/);
    });

    it("rejects an empty-string entry", () => {
      expect(() => validateFollowUpAnswer({ answer: "An answer.", suggestedFollowUps: ["  "] })).toThrow(
        /must be a non-empty string/
      );
    });

    it("rejects an entry that exceeds the length bound", () => {
      expect(() =>
        validateFollowUpAnswer({ answer: "An answer.", suggestedFollowUps: ["x".repeat(121)] })
      ).toThrow(/exceeded expected length/);
    });

    it("caps the number of suggestions rather than rejecting an oversized list", () => {
      const many = Array.from({ length: 10 }, (_, i) => `Question ${i}?`);
      const result = validateFollowUpAnswer({ answer: "An answer.", suggestedFollowUps: many });
      expect(result.suggestedFollowUps).toHaveLength(5);
      expect(result.suggestedFollowUps).toEqual(many.slice(0, 5));
    });
  });

  describe("diagnostic-language guard (same discipline as the main coaching output)", () => {
    const cases = [
      "You have obstructive sleep apnea based on what you've described.",
      "You've got OSA, unfortunately.",
      "You're diagnosed with a sleep breathing disorder.",
      "This confirms your suspicion.",
      "You definitely have sleep apnea given your symptoms.",
    ];

    for (const text of cases) {
      it(`rejects: "${text}"`, () => {
        expect(() =>
          validateFollowUpAnswer({ answer: text, suggestedFollowUps: VALID_SUGGESTIONS })
        ).toThrow(/diagnostic-sounding language/);
      });
    }

    it("does not false-positive on explaining what the screening tool does", () => {
      expect(() =>
        validateFollowUpAnswer({
          answer: "STOP-BANG scores you across 8 items to estimate OSA risk, not to diagnose it directly.",
          suggestedFollowUps: VALID_SUGGESTIONS,
        })
      ).not.toThrow();
    });
  });
});
