// Age/sex-synced VO2max reference ranges.
// Source: ACSM Guidelines for Exercise Testing and Prescription (11th ed., 2021, Table 4.7),
// based on The Cooper Institute's Aerobics Center Longitudinal Study (~80,000 adults).
// Values are for the general non-athlete population, in ml/kg/min.
//
// Single source of truth for age-relative VO2max classification — assessFitnessContext in
// riskTrajectory.ts delegates its fitnessLevel band to this file's getVO2MaxRangeContext.

export type Sex = "male" | "female";

interface SexRange {
  typicalLow: number;
  typicalHigh: number;
  /** Roughly the "Good" threshold — shown as a rough target, not a classification boundary. */
  strong: number;
}

interface AgeBand {
  minAge: number; // inclusive
  maxAge: number; // inclusive, Infinity for the open-ended top band
  male: SexRange;
  female: SexRange;
}

const VO2MAX_BANDS: AgeBand[] = [
  { minAge: 20, maxAge: 29, male: { typicalLow: 37, typicalHigh: 41, strong: 46 }, female: { typicalLow: 29, typicalHigh: 32, strong: 37 } },
  { minAge: 30, maxAge: 39, male: { typicalLow: 35, typicalHigh: 39, strong: 44 }, female: { typicalLow: 28, typicalHigh: 31, strong: 36 } },
  { minAge: 40, maxAge: 49, male: { typicalLow: 33, typicalHigh: 37, strong: 42 }, female: { typicalLow: 26, typicalHigh: 29, strong: 34 } },
  { minAge: 50, maxAge: 59, male: { typicalLow: 30, typicalHigh: 34, strong: 39 }, female: { typicalLow: 23, typicalHigh: 27, strong: 32 } },
  { minAge: 60, maxAge: 69, male: { typicalLow: 26, typicalHigh: 30, strong: 35 }, female: { typicalLow: 21, typicalHigh: 24, strong: 29 } },
  { minAge: 70, maxAge: Infinity, male: { typicalLow: 23, typicalHigh: 27, strong: 32 }, female: { typicalLow: 19, typicalHigh: 22, strong: 27 } },
];

export type FitnessBand = "below_average" | "average" | "above_average";

export interface VO2MaxRangeContext {
  typicalLow: number;
  typicalHigh: number;
  strongThreshold: number;
  band: FitnessBand;
}

/**
 * Returns the typical VO2max range for the user's age/sex bracket, plus where their
 * own value falls relative to it. Table starts at age 20 — ages below that fall back
 * to the youngest bracket rather than extrapolating.
 */
export function getVO2MaxRangeContext(vo2max: number, age: number, sex: Sex): VO2MaxRangeContext {
  const clampedAge = Math.max(20, age);
  const bracket =
    VO2MAX_BANDS.find((b) => clampedAge >= b.minAge && clampedAge <= b.maxAge) ??
    VO2MAX_BANDS[VO2MAX_BANDS.length - 1];

  const { typicalLow, typicalHigh, strong } = bracket[sex];

  let band: FitnessBand;
  if (vo2max < typicalLow) band = "below_average";
  else if (vo2max > typicalHigh) band = "above_average";
  else band = "average";

  return { typicalLow, typicalHigh, strongThreshold: strong, band };
}
