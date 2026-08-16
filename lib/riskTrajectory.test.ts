import { describe, it, expect } from "vitest";
import {
  computeStopBangScore,
  peerAverageVo2max,
  assessFitnessContext,
  classifyFitnessLevel,
  detectMilestone,
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

  it("includes fitnessLevel derived from the ratio", () => {
    // peerAverageVo2max(30) === 41; 30/41 ≈ 0.73, well under the 0.85 below_average threshold
    expect(assessFitnessContext(30, 30, []).fitnessLevel).toBe("below_average");
    // 41/41 === 1, squarely average
    expect(assessFitnessContext(41, 30, []).fitnessLevel).toBe("average");
    // 50/41 ≈ 1.22, over the 1.15 above_average threshold
    expect(assessFitnessContext(50, 30, []).fitnessLevel).toBe("above_average");
  });
});

describe("classifyFitnessLevel", () => {
  it("classifies below-average at the boundary", () => {
    expect(classifyFitnessLevel(0.84)).toBe("below_average");
    expect(classifyFitnessLevel(0.85)).toBe("average");
  });

  it("classifies above-average at the boundary", () => {
    expect(classifyFitnessLevel(1.15)).toBe("average");
    expect(classifyFitnessLevel(1.16)).toBe("above_average");
  });

  it("classifies exactly at peer average as average", () => {
    expect(classifyFitnessLevel(1.0)).toBe("average");
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
