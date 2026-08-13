/**
 * OSA risk assessment: STOP-BANG questionnaire scoring + VO2max fitness trend as supporting
 * context.
 *
 * STOP-BANG is a validated 8-item OSA screening tool (Chung et al.), widely used clinically
 * (e.g. pre-operative screening). Thresholds and item definitions verified against current
 * clinical references — see AEROCOACH_PLAN.md for sourcing notes.
 *
 * VO2max is deliberately NOT an input to the STOP-BANG risk tier below. The evidence base for
 * VO2max/cardiorespiratory fitness is mortality and general disease risk, not OSA specifically
 * — low fitness and OSA are both correlated with obesity, but that's not the same as VO2max
 * predicting OSA. VO2max trend is surfaced as separate supporting context only.
 */

export interface StopBangAnswers {
  snoring: boolean;
  tiredness: boolean;
  observedApnea: boolean;
  highBloodPressure: boolean;
  bmiOver35: boolean;
  ageOver50: boolean;
  neckOver40cm: boolean;
  male: boolean;
}

export type OsaRiskLevel = "low" | "intermediate" | "high";

export interface StopBangResult {
  score: number;
  riskLevel: OsaRiskLevel;
}

const STOP_ITEMS: Array<keyof StopBangAnswers> = ["snoring", "tiredness", "observedApnea", "highBloodPressure"];
const BANG_ITEMS: Array<keyof StopBangAnswers> = ["bmiOver35", "ageOver50", "neckOver40cm", "male"];

export function computeStopBangScore(answers: StopBangAnswers): StopBangResult {
  const score = Object.values(answers).filter(Boolean).length;

  const stopCount = STOP_ITEMS.filter((k) => answers[k]).length;
  const bangCount = BANG_ITEMS.filter((k) => answers[k]).length;

  let riskLevel: OsaRiskLevel;
  if (score >= 5) {
    riskLevel = "high";
  } else if (score <= 2) {
    riskLevel = "low";
  } else if (score === 3 && stopCount >= 2 && bangCount >= 1) {
    // Refined high-risk rule: a borderline score of 3 with at least 2 STOP items and at
    // least 1 BANG item is treated as high risk, per the validated scoring refinement.
    riskLevel = "high";
  } else {
    riskLevel = "intermediate";
  }

  return { score, riskLevel };
}

export type FitnessTrend = "improving" | "stable" | "declining" | "insufficient_data";

/** Coarse general-population average VO2max (mL/kg/min) by age decade, sex-unspecified. */
const PEER_AVERAGE_BY_AGE: Array<{ age: number; vo2max: number }> = [
  { age: 20, vo2max: 45 },
  { age: 30, vo2max: 41 },
  { age: 40, vo2max: 37 },
  { age: 50, vo2max: 33 },
  { age: 60, vo2max: 29 },
  { age: 70, vo2max: 26 },
  { age: 80, vo2max: 23 },
];

export function peerAverageVo2max(age: number): number {
  const points = PEER_AVERAGE_BY_AGE;
  if (age <= points[0].age) return points[0].vo2max;
  if (age >= points[points.length - 1].age) return points[points.length - 1].vo2max;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (age >= a.age && age <= b.age) {
      const t = (age - a.age) / (b.age - a.age);
      return a.vo2max + t * (b.vo2max - a.vo2max);
    }
  }
  return points[points.length - 1].vo2max;
}

export interface FitnessContext {
  vo2max: number;
  peerAverageVo2max: number;
  ratioToPeerAverage: number;
  trend: FitnessTrend;
}

/**
 * Fitness context is presented as general health background alongside the STOP-BANG result —
 * never as a factor that changes the OSA risk tier itself.
 */
export function assessFitnessContext(vo2max: number, age: number, recentVo2max: number[]): FitnessContext {
  const peerAverage = peerAverageVo2max(age);
  const ratio = vo2max / peerAverage;

  let trend: FitnessTrend = "insufficient_data";
  if (recentVo2max.length >= 3) {
    const first = recentVo2max[0];
    const last = recentVo2max[recentVo2max.length - 1];
    const delta = last - first;
    if (Math.abs(delta) < 0.5) trend = "stable";
    else trend = delta > 0 ? "improving" : "declining";
  }

  return {
    vo2max,
    peerAverageVo2max: Math.round(peerAverage * 10) / 10,
    ratioToPeerAverage: Math.round(ratio * 100) / 100,
    trend,
  };
}
