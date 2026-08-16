import { NextRequest, NextResponse } from "next/server";
import { getFollowUpAnswer, type CoachDecision, type FollowUpMessage, type RecommendedActionType } from "@/lib/geminiCoach";
import type {
  StopBangResult,
  FitnessContext,
  OsaRiskLevel,
  FitnessTrend,
  FitnessLevel,
  OxygenContext,
  OxygenLevel,
} from "@/lib/riskTrajectory";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import { getValidSession } from "@/lib/googleHealth";

const RISK_LEVELS: OsaRiskLevel[] = ["low", "intermediate", "high"];
const ACTION_TYPES: RecommendedActionType[] = ["monitor", "mention_to_doctor", "see_doctor_soon"];
const TRENDS: FitnessTrend[] = ["improving", "stable", "declining", "insufficient_data"];
const FITNESS_LEVELS: FitnessLevel[] = ["below_average", "average", "above_average"];
const OXYGEN_LEVELS: OxygenLevel[] = ["normal", "borderline", "low"];
const MAX_QUESTION_LENGTH = 300;
const MAX_HISTORY_MESSAGES = 20;

interface AskRequestBody {
  stopBang: StopBangResult;
  fitness: FitnessContext;
  oxygen: OxygenContext | null;
  decision: CoachDecision;
  history: FollowUpMessage[];
  question: string;
}

function isStopBangResult(value: unknown): value is StopBangResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.score === "number" && v.score >= 0 && v.score <= 8 && RISK_LEVELS.includes(v.riskLevel as OsaRiskLevel);
}

function isFitnessContext(value: unknown): value is FitnessContext {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.vo2max === "number" &&
    typeof v.peerAverageVo2max === "number" &&
    typeof v.ratioToPeerAverage === "number" &&
    FITNESS_LEVELS.includes(v.fitnessLevel as FitnessLevel) &&
    TRENDS.includes(v.trend as FitnessTrend)
  );
}

function isOxygenContext(value: unknown): value is OxygenContext | null {
  if (value === null) return true;
  if (typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.percentage === "number" && OXYGEN_LEVELS.includes(v.level as OxygenLevel);
}

function isCoachDecision(value: unknown): value is CoachDecision {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.riskExplanation !== "string" || typeof v.motivationalNudge !== "string") return false;
  const action = v.recommendedAction as Record<string, unknown> | undefined;
  return (
    typeof action === "object" &&
    action !== null &&
    ACTION_TYPES.includes(action.type as RecommendedActionType) &&
    typeof action.rationale === "string"
  );
}

function isHistory(value: unknown): value is FollowUpMessage[] {
  if (!Array.isArray(value) || value.length > MAX_HISTORY_MESSAGES) return false;
  return value.every(
    (m) =>
      typeof m === "object" &&
      m !== null &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.text === "string"
  );
}

export function parseAskBody(body: unknown): AskRequestBody | null {
  if (typeof body !== "object" || body === null) return null;
  const v = body as Record<string, unknown>;
  if (!isStopBangResult(v.stopBang)) return null;
  if (!isFitnessContext(v.fitness)) return null;
  if (!isOxygenContext(v.oxygen)) return null;
  if (!isCoachDecision(v.decision)) return null;
  if (!isHistory(v.history)) return null;
  if (typeof v.question !== "string" || v.question.trim().length === 0 || v.question.length > MAX_QUESTION_LENGTH) {
    return null;
  }
  return v as unknown as AskRequestBody;
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(getClientKey(request));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many requests — please slow down." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  // Same auth gate as /api/coach — without this, anyone could hit this route directly with
  // fabricated context and spam Gemini calls without ever going through the real STOP-BANG
  // flow that /api/coach requires first.
  const session = await getValidSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body", message: "Expected JSON body" }, { status: 400 });
  }

  const parsed = parseAskBody(body);
  if (!parsed) {
    return NextResponse.json(
      {
        error: "invalid_ask_request",
        message: `Expected stopBang, fitness, decision, history, and a question (1-${MAX_QUESTION_LENGTH} chars)`,
      },
      { status: 400 }
    );
  }

  try {
    const result = await getFollowUpAnswer(parsed);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Failed to get follow-up answer:", e);
    return NextResponse.json(
      { error: "gemini_error", message: "Couldn't answer that. Please try again." },
      { status: 502 }
    );
  }
}
