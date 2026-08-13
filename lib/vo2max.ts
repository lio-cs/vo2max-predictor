/**
 * Non-exercise VO2max estimation from resting heart rate and age.
 *
 * Formula: Uth–Sørensen–Overgaard–Pedersen (2004), with HRmax estimated via
 * the Tanaka et al. (2001) age-based formula. Most accurate for moderately
 * fit adults; not a substitute for a lab-measured VO2max test.
 */

export function estimateHRMax(age: number): number {
  return 208 - 0.7 * age;
}

export function estimateVO2Max(age: number, restingHeartRate: number): number {
  const hrMax = estimateHRMax(age);
  return 15.3 * (hrMax / restingHeartRate);
}
