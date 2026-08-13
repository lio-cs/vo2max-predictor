import { getAge, getLatestRestingHeartRate, getValidSession } from "./googleHealth";
import { estimateVO2Max } from "./vo2max";

export interface Vo2MaxResult {
  age: number;
  restingHeartRate: number;
  vo2max: number;
}

export type Vo2MaxError =
  | { error: "not_authenticated" }
  | { error: "no_resting_heart_rate"; message: string }
  | { error: "no_age"; message: string }
  | { error: "health_api_error"; message: string };

export async function computeVo2Max(): Promise<Vo2MaxResult | Vo2MaxError> {
  const session = await getValidSession();
  if (!session) {
    return { error: "not_authenticated" };
  }

  try {
    const [age, restingHeartRate] = await Promise.all([
      getAge(session),
      getLatestRestingHeartRate(session),
    ]);

    if (age == null) {
      return {
        error: "no_age",
        message: "Your Google Health profile doesn't have an age set yet.",
      };
    }

    if (restingHeartRate == null) {
      return {
        error: "no_resting_heart_rate",
        message:
          "No resting heart rate found yet — wear your Fitbit for a few more days and check back.",
      };
    }

    const vo2max = Math.round(estimateVO2Max(age, restingHeartRate) * 10) / 10;

    return { age, restingHeartRate, vo2max };
  } catch (e) {
    // Full detail server-side only — this flows straight into the UI, so raw upstream error
    // text (which can include Google Health API response bodies) shouldn't reach the user.
    console.error("Google Health API error:", e);
    return {
      error: "health_api_error",
      message: "Something went wrong talking to Google Health. Please try again.",
    };
  }
}
