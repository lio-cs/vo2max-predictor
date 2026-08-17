import { NextRequest, NextResponse } from "next/server";
import { setAppleSession } from "@/lib/appleHealthSession";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

interface ImportRequestBody {
  age: number;
  restingHeartRate: number;
  oxygenPercentage: number | null;
}

// Generous but not unbounded — same spirit as the STOP-BANG/coach routes' input validation:
// reject obviously-wrong values rather than trust the client blindly, even though this data
// never reaches Gemini directly (it only feeds the same deterministic VO2max/oxygen
// classification the Google pipeline uses).
export function parseImportBody(body: unknown): ImportRequestBody | null {
  if (typeof body !== "object" || body === null) return null;
  const v = body as Record<string, unknown>;

  if (typeof v.age !== "number" || !Number.isFinite(v.age) || v.age < 1 || v.age > 120) return null;
  if (
    typeof v.restingHeartRate !== "number" ||
    !Number.isFinite(v.restingHeartRate) ||
    v.restingHeartRate < 20 ||
    v.restingHeartRate > 220
  ) {
    return null;
  }
  if (v.oxygenPercentage !== null) {
    if (typeof v.oxygenPercentage !== "number" || !Number.isFinite(v.oxygenPercentage) || v.oxygenPercentage < 50 || v.oxygenPercentage > 100) {
      return null;
    }
  }

  return { age: v.age, restingHeartRate: v.restingHeartRate, oxygenPercentage: v.oxygenPercentage as number | null };
}

/**
 * Receives only the handful of scalars already extracted client-side by
 * lib/appleHealthParse.ts — never the export.zip itself. See that file's comment for why: the
 * raw export is commonly hundreds of MB and Cloud Run hard-caps request bodies at 32MB, plus
 * there's no reason for the server to ever see the full export.
 */
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

  const parsed = parseImportBody(body);
  if (!parsed) {
    return NextResponse.json(
      { error: "invalid_import", message: "Expected a plausible age, resting heart rate, and optional oxygen percentage" },
      { status: 400 }
    );
  }

  await setAppleSession(parsed);
  return NextResponse.json({ ok: true });
}
