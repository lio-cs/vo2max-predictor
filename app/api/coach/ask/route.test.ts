import { describe, it, expect } from "vitest";
import { parseAskBody } from "./route";

const VALID = {
  stopBang: { score: 3, riskLevel: "intermediate" },
  fitness: { vo2max: 38, peerAverageVo2max: 37, ratioToPeerAverage: 1.03, fitnessLevel: "average", trend: "stable" },
  oxygen: null as { percentage: number; level: string } | null,
  decision: {
    riskExplanation: "Your score puts you in the intermediate group.",
    recommendedAction: { type: "mention_to_doctor", rationale: "Worth a mention at your next visit." },
    motivationalNudge: "Your fitness trend has been steady — good foundation to build on.",
  },
  history: [{ role: "user", text: "What does that mean?" }],
  question: "Should I be worried?",
};

describe("parseAskBody", () => {
  it("parses a valid, complete payload", () => {
    expect(parseAskBody(VALID)).toEqual(VALID);
  });

  it("accepts an empty history array (first question)", () => {
    expect(parseAskBody({ ...VALID, history: [] })).toEqual({ ...VALID, history: [] });
  });

  it("rejects null and non-objects", () => {
    expect(parseAskBody(null)).toBeNull();
    expect(parseAskBody("nope")).toBeNull();
  });

  it("rejects an invalid STOP-BANG risk level", () => {
    expect(parseAskBody({ ...VALID, stopBang: { score: 3, riskLevel: "extreme" } })).toBeNull();
  });

  it("rejects a STOP-BANG score out of range", () => {
    expect(parseAskBody({ ...VALID, stopBang: { score: 99, riskLevel: "high" } })).toBeNull();
  });

  it("rejects an invalid fitness trend", () => {
    expect(
      parseAskBody({ ...VALID, fitness: { ...VALID.fitness, trend: "skyrocketing" } })
    ).toBeNull();
  });

  it("accepts null oxygen (device doesn't support it)", () => {
    expect(parseAskBody({ ...VALID, oxygen: null })).toEqual({ ...VALID, oxygen: null });
  });

  it("accepts a valid non-null oxygen context", () => {
    const oxygen = { percentage: 96, level: "normal" };
    expect(parseAskBody({ ...VALID, oxygen })).toEqual({ ...VALID, oxygen });
  });

  it("rejects an oxygen object with an invalid level", () => {
    expect(
      parseAskBody({ ...VALID, oxygen: { percentage: 96, level: "excellent" } })
    ).toBeNull();
  });

  it("rejects an oxygen object missing percentage", () => {
    expect(parseAskBody({ ...VALID, oxygen: { level: "normal" } })).toBeNull();
  });

  it("rejects an invalid recommended action type", () => {
    expect(
      parseAskBody({
        ...VALID,
        decision: { ...VALID.decision, recommendedAction: { type: "cure_it", rationale: "nope" } },
      })
    ).toBeNull();
  });

  it("rejects a history entry with a bad role", () => {
    expect(parseAskBody({ ...VALID, history: [{ role: "system", text: "hi" }] })).toBeNull();
  });

  it("rejects history longer than the cap", () => {
    const longHistory = Array.from({ length: 21 }, () => ({ role: "user" as const, text: "hi" }));
    expect(parseAskBody({ ...VALID, history: longHistory })).toBeNull();
  });

  it("rejects an empty question", () => {
    expect(parseAskBody({ ...VALID, question: "   " })).toBeNull();
  });

  it("rejects a question over the length cap", () => {
    expect(parseAskBody({ ...VALID, question: "x".repeat(301) })).toBeNull();
  });

  it("rejects a missing field entirely", () => {
    const incomplete: Record<string, unknown> = { ...VALID };
    delete incomplete.question;
    expect(parseAskBody(incomplete)).toBeNull();
  });
});
