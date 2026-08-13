import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthorizeUrl } from "@/lib/googleHealth";

export async function GET() {
  const state = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set("google_health_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(getAuthorizeUrl(state));
}
