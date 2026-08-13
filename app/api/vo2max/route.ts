import { NextResponse } from "next/server";
import { computeVo2Max } from "@/lib/vo2max-service";

export async function GET() {
  const result = await computeVo2Max();

  if ("error" in result) {
    const status =
      result.error === "not_authenticated"
        ? 401
        : result.error === "no_resting_heart_rate" || result.error === "no_age"
          ? 422
          : 502;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
