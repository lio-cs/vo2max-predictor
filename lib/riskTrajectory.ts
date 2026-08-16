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

export type FitnessLevel = "below_average" | "average" | "above_average";

/**
 * Age-relative VO2max categorization — a standard, well-established exercise-physiology
 * comparison (VO2max-for-age norms), not a disease-risk claim, so it doesn't carry the same
 * evidence-base caution as the OSA risk tier above. Thresholds are deliberately the same
 * ratio bands used for general fitness categorization elsewhere in sports-medicine literature.
 */
export function classifyFitnessLevel(ratioToPeerAverage: number): FitnessLevel {
  if (ratioToPeerAverage < 0.85) return "below_average";
  if (ratioToPeerAverage > 1.15) return "above_average";
  return "average";
}

export interface FitnessContext {
  vo2max: number;
  peerAverageVo2max: number;
  ratioToPeerAverage: number;
  fitnessLevel: FitnessLevel;
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
    fitnessLevel: classifyFitnessLevel(ratio),
    trend,
  };
}

export interface VO2maxHistoryPoint {
  date: string; // YYYY-MM-DD
  vo2max: number;
}

export type MilestoneType = "new_high" | "improving_streak";

export interface Milestone {
  type: MilestoneType;
  message: string;
}

const IMPROVING_STREAK_THRESHOLD = 3;

/**
 * Deterministic milestone detection over a VO2max history (oldest first, most recent last) —
 * kept as plain arithmetic, not left to the model, same reasoning as everything else in this
 * file: Gemini explains what's already been decided, it doesn't decide it.
 */
export function detectMilestone(history: VO2maxHistoryPoint[]): Milestone | null {
  if (history.length < 2) return null;

  const latest = history[history.length - 1];
  const isNewHigh = history.slice(0, -1).every((point) => point.vo2max < latest.vo2max);
  if (isNewHigh) {
    return { type: "new_high", message: "That's your highest VO2max reading yet." };
  }

  let streak = 1;
  for (let i = history.length - 1; i > 0; i--) {
    if (history[i].vo2max > history[i - 1].vo2max) {
      streak++;
    } else {
      break;
    }
  }
  if (streak >= IMPROVING_STREAK_THRESHOLD) {
    return { type: "improving_streak", message: `${streak} readings in a row trending up.` };
  }

  return null;
}

export type OxygenLevel = "normal" | "borderline" | "low";

export interface OxygenContext {
  percentage: number;
  level: OxygenLevel;
}

/**
 * Standard clinical resting SpO2 interpretation (≥95% normal, 90-94% borderline, <90% low
 * hypoxemia) — widely accepted thresholds, not specific to OSA. Unlike STOP-BANG, this is
 * deliberately NOT an input to the OSA risk tier: unlike full overnight desaturation-event
 * monitoring (what actually diagnoses OSA-related hypoxemia clinically), what the wearable
 * provides is a single daily average — a much coarser signal. Same treatment as VO2max:
 * genuine supporting context, never something that changes the STOP-BANG-derived risk tier.
 */
export function classifyOxygenLevel(percentage: number): OxygenLevel {
  if (percentage < 90) return "low";
  if (percentage < 95) return "borderline";
  return "normal";
}

export function assessOxygenContext(percentage: number): OxygenContext {
  return { percentage, level: classifyOxygenLevel(percentage) };
}
