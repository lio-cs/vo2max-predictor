import { describe, it, expect } from "vitest";
import {
  computeStopBangScore,
  peerAverageVo2max,
  assessFitnessContext,
  detectMilestone,
  classifyOxygenLevel,
  assessOxygenContext,
  type StopBangAnswers,
  type VO2maxHistoryPoint,
} from "./riskTrajectory";

function history(...vo2maxValues: number[]): VO2maxHistoryPoint[] {
  return vo2maxValues.map((vo2max, i) => ({ date: `2026-08-${10 + i}`, vo2max }));
}

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
    const result = assessFitnessContext(40, 30, [39, 40], "male");
    expect(result.trend).toBe("insufficient_data");
  });

  it("reports insufficient_data with zero prior readings", () => {
    const result = assessFitnessContext(40, 30, [], "male");
    expect(result.trend).toBe("insufficient_data");
  });

  it("reports stable when the trend delta is small", () => {
    const result = assessFitnessContext(40.3, 30, [40, 40.2, 40.3], "male");
    expect(result.trend).toBe("stable");
  });

  it("reports improving when VO2max is trending up", () => {
    const result = assessFitnessContext(40, 30, [36, 38, 40], "male");
    expect(result.trend).toBe("improving");
  });

  it("reports declining when VO2max is trending down", () => {
    const result = assessFitnessContext(38, 30, [42, 40, 38], "male");
    expect(result.trend).toBe("declining");
  });

  it("computes ratioToPeerAverage against the age-based peer average", () => {
    const result = assessFitnessContext(41, 30, [], "male");
    // peerAverageVo2max(30) === 41, so ratio should be exactly 1
    expect(result.peerAverageVo2max).toBe(41);
    expect(result.ratioToPeerAverage).toBe(1);
  });

  it("includes fitnessLevel derived from the age/sex ACSM band, not the peer-average ratio", () => {
    // Age 30 male band (vo2maxRanges.ts): typicalLow 35, typicalHigh 39
    expect(assessFitnessContext(30, 30, [], "male").fitnessLevel).toBe("below_average");
    expect(assessFitnessContext(37, 30, [], "male").fitnessLevel).toBe("average");
    expect(assessFitnessContext(45, 30, [], "male").fitnessLevel).toBe("above_average");
    // Age 30 female band: typicalLow 28, typicalHigh 31 — same vo2max as the male "average"
    // case above lands as above_average for female, confirming sex actually changes the band.
    expect(assessFitnessContext(37, 30, [], "female").fitnessLevel).toBe("above_average");
  });
});

describe("detectMilestone", () => {
  it("returns null with fewer than 2 readings", () => {
    expect(detectMilestone([])).toBeNull();
    expect(detectMilestone(history(40))).toBeNull();
  });

  it("returns null when nothing notable happened", () => {
    expect(detectMilestone(history(40, 39, 40))).toBeNull();
  });

  it("detects a new high when the latest reading beats every prior one", () => {
    const result = detectMilestone(history(38, 39, 41));
    expect(result).toEqual({ type: "new_high", message: "That's your highest VO2max reading yet." });
  });

  it("does not call a tie a new high", () => {
    expect(detectMilestone(history(40, 41, 41))).toBeNull();
  });

  it("detects a 3+ improving streak even without a new high", () => {
    // Peaked at 50, now recovering: 3 in a row improving (44 -> 46 -> 48) but still below the
    // earlier high of 50, so this should be a streak, not a new_high.
    const result = detectMilestone(history(50, 44, 46, 48));
    expect(result).toEqual({ type: "improving_streak", message: "3 readings in a row trending up." });
  });

  it("does not flag a streak shorter than the threshold", () => {
    expect(detectMilestone(history(50, 44, 46))).toBeNull();
  });

  it("a new high takes precedence over reporting it as a streak", () => {
    const result = detectMilestone(history(38, 39, 40, 41));
    expect(result?.type).toBe("new_high");
  });
});

describe("classifyOxygenLevel", () => {
  it("classifies normal at and above 95%", () => {
    expect(classifyOxygenLevel(95)).toBe("normal");
    expect(classifyOxygenLevel(98)).toBe("normal");
  });

  it("classifies borderline between 90% and 94%", () => {
    expect(classifyOxygenLevel(94)).toBe("borderline");
    expect(classifyOxygenLevel(90)).toBe("borderline");
  });

  it("classifies low below 90%", () => {
    expect(classifyOxygenLevel(89)).toBe("low");
    expect(classifyOxygenLevel(80)).toBe("low");
  });
});

describe("assessOxygenContext", () => {
  it("bundles the percentage with its classification", () => {
    expect(assessOxygenContext(96)).toEqual({ percentage: 96, level: "normal" });
    expect(assessOxygenContext(92)).toEqual({ percentage: 92, level: "borderline" });
    expect(assessOxygenContext(85)).toEqual({ percentage: 85, level: "low" });
  });
});
