import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/googleHealth";
import { setSession } from "@/lib/session";

/**
 * Deliberately NOT `new URL(request.url).origin` — behind Cloud Run's proxy, that reflects the
 * container's internal bind address (HOSTNAME=0.0.0.0), not the real public host, which sent
 * users' browsers to the unroutable http://0.0.0.0:3000 after login. GOOGLE_HEALTH_REDIRECT_URI
 * is already the real public URL (it has to be, to satisfy Google's own redirect_uri check), so
 * derive the app's origin from that instead of trusting request.url.
 */
function getAppOrigin(): string {
  const redirectUri = process.env.GOOGLE_HEALTH_REDIRECT_URI;
  if (!redirectUri) {
    throw new Error("Missing required env var: GOOGLE_HEALTH_REDIRECT_URI");
  }
  return new URL(redirectUri).origin;
}

export async function GET(request: NextRequest) {
  const origin = getAppOrigin();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("google_health_oauth_state")?.value;
  cookieStore.delete("google_health_oauth_state");

  if (oauthError) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(oauthError)}`);
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/?error=invalid_state`);
  }

  try {
    const session = await exchangeCodeForTokens(code);
    await setSession(session);
  } catch {
    return NextResponse.redirect(`${origin}/?error=token_exchange_failed`);
  }

  return NextResponse.redirect(`${origin}/`);
}
