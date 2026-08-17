import { NextRequest, NextResponse } from "next/server";
import { computeVo2Max, vo2MaxFromAppleSession, type Vo2MaxResult, type Vo2MaxError } from "@/lib/vo2max-service";
import {
  computeStopBangScore,
  assessFitnessContext,
  assessOxygenContext,
  detectMilestone,
  type StopBangAnswers,
  type VO2maxHistoryPoint,
  type OxygenContext,
} from "@/lib/riskTrajectory";
import { getCoachDecision } from "@/lib/geminiCoach";
import { appendLogEntry, getRecentLogs, isLoggingEnabled, type CoachLogEntry } from "@/lib/coachLog";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import { getValidSession, getLatestOxygenSaturation } from "@/lib/googleHealth";
import { getSession, getUserKey } from "@/lib/session";
import { getAppleSession, getAppleUserKey } from "@/lib/appleHealthSession";

const STOP_BANG_KEYS: Array<keyof StopBangAnswers> = [
  "snoring",
  "tiredness",
  "observedApnea",
  "highBloodPressure",
  "bmiOver35",
  "ageOver50",
  "neckOver40cm",
  "male",
];

export function parseStopBangAnswers(body: unknown): StopBangAnswers | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  const answers = {} as StopBangAnswers;
  for (const key of STOP_BANG_KEYS) {
    if (typeof record[key] !== "boolean") return null;
    answers[key] = record[key] as boolean;
  }
  return answers;
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(getClientKey(request));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many requests — please slow down." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body", message: "Expected JSON body" }, { status: 400 });
  }

  const stopBangAnswers = parseStopBangAnswers((body as { stopBang?: unknown })?.stopBang);
  if (!stopBangAnswers) {
    return NextResponse.json(
      { error: "invalid_stop_bang", message: "Expected `stopBang` with all 8 boolean answers" },
      { status: 400 }
    );
  }

  // Two independent providers can be "connected": Google Health (Fitbit, via OAuth) or Apple
  // Health (via a client-side-parsed export — see lib/appleHealthParse.ts and
  // app/api/apple-health/import/route.ts). Whichever cookie is present decides the branch; the
  // Google branch below is the exact same calls as before this feature existed, unchanged.
  const googleSession = await getSession();
  const appleSession = googleSession ? null : await getAppleSession();

  let vo2Result: Vo2MaxResult | Vo2MaxError;
  let userKey: string;
  let oxygenPercentage: number | null = null;

  if (googleSession) {
    vo2Result = await computeVo2Max();
    if ("error" in vo2Result) {
      const status =
        vo2Result.error === "not_authenticated"
          ? 401
          : vo2Result.error === "no_resting_heart_rate" || vo2Result.error === "no_age"
            ? 422
            : 502;
      return NextResponse.json(vo2Result, { status });
    }

    // computeVo2Max() already confirmed a valid session exists; this re-read just gets the
    // session object itself so logs can be scoped per-user instead of colliding in one document.
    const session = await getValidSession();
    if (!session) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    userKey = getUserKey(session);

    // Optional/best-effort — many devices don't support SpO2 at all, and this isn't required
    // for the core flow the way age/resting heart rate are, so a failure here shouldn't fail
    // the whole request.
    try {
      oxygenPercentage = await getLatestOxygenSaturation(session);
    } catch (e) {
      console.error("Failed to fetch oxygen saturation (continuing without it):", e);
    }
  } else if (appleSession) {
    // Already validated at import time (see lib/appleHealthParse.ts) — this is a pure,
    // synchronous conversion using the same estimateVO2Max formula as the Google path, not a
    // fallible fetch, so there's no error branch to handle here.
    vo2Result = vo2MaxFromAppleSession(appleSession);
    userKey = getAppleUserKey(appleSession);
    oxygenPercentage = appleSession.oxygenPercentage;
  } else {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { age, vo2max } = vo2Result;
  const stopBang = computeStopBangScore(stopBangAnswers);

  let recentLogs: CoachLogEntry[] = [];
  try {
    recentLogs = await getRecentLogs(userKey);
  } catch (e) {
    // Full detail server-side only — an external caller doesn't need to see internal
    // Firestore error shapes/project details.
    console.error("Failed to read coach logs:", e);
    return NextResponse.json(
      { error: "coach_log_error", message: "Couldn't read coaching history. Please try again." },
      { status: 502 }
    );
  }

  const fitness = assessFitnessContext(
    vo2max,
    age,
    recentLogs.map((entry) => entry.fitness.vo2max),
    stopBangAnswers.male ? "male" : "female"
  );

  const oxygen: OxygenContext | null = oxygenPercentage != null ? assessOxygenContext(oxygenPercentage) : null;

  let decision;
  try {
    decision = await getCoachDecision({ stopBang, fitness, oxygen, recentLogs });
  } catch (e) {
    // Full detail is already captured server-side via LangFuse tracing (see geminiCoach.ts) —
    // an external caller only needs to know it failed, not the internal error shape.
    console.error("Failed to get coach decision:", e);
    return NextResponse.json(
      { error: "gemini_error", message: "Couldn't generate today's coaching. Please try again." },
      { status: 502 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const entry: CoachLogEntry = { date: today, fitness, stopBang, decision };

  try {
    await appendLogEntry(userKey, entry);
  } catch (e) {
    // Logging failure shouldn't block today's coaching response — the decision was already
    // made, and the practice build should still be usable if Firestore is momentarily down.
    console.error("Failed to write coach log entry:", e);
  }

  const history: VO2maxHistoryPoint[] = [
    ...recentLogs.map((e) => ({ date: e.date, vo2max: e.fitness.vo2max })),
    { date: today, vo2max },
  ];
  const milestone = detectMilestone(history);

  return NextResponse.json({
    fitness,
    oxygen,
    stopBang,
    decision,
    history,
    milestone,
    loggingEnabled: isLoggingEnabled(),
  });
}
