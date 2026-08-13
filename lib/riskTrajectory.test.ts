import { describe, it, expect } from "vitest";
import { computeStopBangScore, peerAverageVo2max, assessFitnessContext, type StopBangAnswers } from "./riskTrajectory";

const NO_ANSWERS: StopBangAnswers = {
  snoring: false,
  tiredness: false,
  observedApnea: false,
  highBloodPressure: false,
  bmiOver35: false,
  ageOver50: false,
  neckOver40cm: false,
  male: false,
};

describe("computeStopBangScore", () => {
  it("scores 0 as low risk", () => {
    expect(computeStopBangScore(NO_ANSWERS)).toEqual({ score: 0, riskLevel: "low" });
  });

  it("scores 2 as low risk (boundary)", () => {
    const result = computeStopBangScore({ ...NO_ANSWERS, snoring: true, tiredness: true });
    expect(result).toEqual({ score: 2, riskLevel: "low" });
  });

  it("scores 3 as intermediate when it's mostly BANG items (refinement doesn't apply)", () => {
    const result = computeStopBangScore({
      ...NO_ANSWERS,
      bmiOver35: true,
      ageOver50: true,
      neckOver40cm: true,
    });
    expect(result).toEqual({ score: 3, riskLevel: "intermediate" });
  });

  it("scores 3 as intermediate when only 1 STOP item + 2 BANG items (refinement needs >=2 STOP)", () => {
    const result = computeStopBangScore({
      ...NO_ANSWERS,
      snoring: true,
      bmiOver35: true,
      ageOver50: true,
    });
    expect(result).toEqual({ score: 3, riskLevel: "intermediate" });
  });

  it("scores 3 as HIGH via the refinement rule: >=2 STOP items + >=1 BANG item", () => {
    const result = computeStopBangScore({
      ...NO_ANSWERS,
      snoring: true,
      tiredness: true,
      bmiOver35: true,
    });
    expect(result).toEqual({ score: 3, riskLevel: "high" });
  });

  it("scores 4 as intermediate", () => {
    const result = computeStopBangScore({
      ...NO_ANSWERS,
      snoring: true,
      tiredness: true,
      observedApnea: true,
      highBloodPressure: true,
    });
    expect(result).toEqual({ score: 4, riskLevel: "intermediate" });
  });

  it("scores 5 as high risk (boundary)", () => {
    const result = computeStopBangScore({
      ...NO_ANSWERS,
      snoring: true,
      tiredness: true,
      observedApnea: true,
      highBloodPressure: true,
      bmiOver35: true,
    });
    expect(result).toEqual({ score: 5, riskLevel: "high" });
  });

  it("scores 8 (all yes) as high risk", () => {
    const allTrue = Object.fromEntries(
      Object.keys(NO_ANSWERS).map((k) => [k, true])
    ) as unknown as StopBangAnswers;
    expect(computeStopBangScore(allTrue)).toEqual({ score: 8, riskLevel: "high" });
  });
});

describe("peerAverageVo2max", () => {
  it("returns the exact table value at a known age", () => {
    expect(peerAverageVo2max(20)).toBe(45);
    expect(peerAverageVo2max(80)).toBe(23);
  });

  it("interpolates linearly between table points", () => {
    // Halfway between age 20 (45) and age 30 (41) -> 43
    expect(peerAverageVo2max(25)).toBe(43);
  });

  it("clamps below the youngest table entry", () => {
    expect(peerAverageVo2max(10)).toBe(45);
  });

  it("clamps above the oldest table entry", () => {
    expect(peerAverageVo2max(95)).toBe(23);
  });
});

describe("assessFitnessContext", () => {
  it("reports insufficient_data with fewer than 3 prior readings", () => {
    const result = assessFitnessContext(40, 30, [39, 40]);
    expect(result.trend).toBe("insufficient_data");
  });

  it("reports insufficient_data with zero prior readings", () => {
    const result = assessFitnessContext(40, 30, []);
    expect(result.trend).toBe("insufficient_data");
  });

  it("reports stable when the trend delta is small", () => {
    const result = assessFitnessContext(40.3, 30, [40, 40.2, 40.3]);
    expect(result.trend).toBe("stable");
  });

  it("reports improving when VO2max is trending up", () => {
    const result = assessFitnessContext(40, 30, [36, 38, 40]);
    expect(result.trend).toBe("improving");
  });

  it("reports declining when VO2max is trending down", () => {
    const result = assessFitnessContext(38, 30, [42, 40, 38]);
    expect(result.trend).toBe("declining");
  });

  it("computes ratioToPeerAverage against the age-based peer average", () => {
    const result = assessFitnessContext(41, 30, []);
    // peerAverageVo2max(30) === 41, so ratio should be exactly 1
    expect(result.peerAverageVo2max).toBe(41);
    expect(result.ratioToPeerAverage).toBe(1);
  });
});
