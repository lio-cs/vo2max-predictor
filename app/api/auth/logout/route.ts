import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

// See app/api/auth/callback/route.ts for why this doesn't use request.url — behind Cloud Run's
// proxy it reflects the container's internal bind address, not the real public host.
function getAppOrigin(): string {
  const redirectUri = process.env.GOOGLE_HEALTH_REDIRECT_URI;
  if (!redirectUri) {
    throw new Error("Missing required env var: GOOGLE_HEALTH_REDIRECT_URI");
  }
  return new URL(redirectUri).origin;
}

export async function GET() {
  await clearSession();
  return NextResponse.redirect(`${getAppOrigin()}/`);
}
