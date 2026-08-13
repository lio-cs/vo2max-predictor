import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/googleHealth";
import { setSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
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
